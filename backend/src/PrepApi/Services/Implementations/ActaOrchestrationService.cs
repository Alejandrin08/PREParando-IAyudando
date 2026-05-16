using Microsoft.EntityFrameworkCore;
using PrepApi.Data;
using PrepApi.DTOs;
using PrepApi.Models;
using PrepApi.Services.Interfaces;

namespace PrepApi.Services.Implementations
{
    public class ActaOrchestrationService : IActaOrchestrationService
    {
        private readonly IBlobStorageService _blobService;
        private readonly IDocumentIntelligenceService _diService;
        private readonly IValidationService _validationService;
        private readonly IQueueService _queueService;
        private readonly ILogger<ActaOrchestrationService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public ActaOrchestrationService(
            IServiceScopeFactory scopeFactory,
            IBlobStorageService blobService,
            IDocumentIntelligenceService diService,
            IValidationService validationService,
            IQueueService queueService,
            ILogger<ActaOrchestrationService> logger)
        {
            _scopeFactory = scopeFactory;
            _blobService = blobService;
            _diService = diService;
            _validationService = validationService;
            _queueService = queueService;
            _logger = logger;
        }

        public async Task<BatchStatusDto> StartBatchAsync(List<IFormFile> images)
        {
            var uploadedCount = 0;
            var failedCount = 0;
            var skippedCount = 0;
            var skippedNames = new List<string>();
            var lockObj = new object();

            const int batchSize = 5;
            var batches = images.Chunk(batchSize);

            foreach (var batch in batches)
            {
                var tasks = batch.Select(async image =>
                {
                    try
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        var existsInBlob = await _blobService.ExistsAsync(image.FileName);
                        var existsInDb = await db.Actas.AnyAsync(a => a.ActaId == image.FileName);

                        if (existsInBlob || existsInDb)
                        {
                            lock (lockObj)
                            {
                                skippedCount++;
                                skippedNames.Add(image.FileName);
                            }
                            _logger.LogWarning("Acta {FileName} already exists, skipping", image.FileName);
                            return;
                        }

                        using var ms = new MemoryStream();
                        await image.CopyToAsync(ms);
                        var bytes = ms.ToArray();

                        var uploadTask = _blobService.UploadActaAsync(image.FileName, bytes, image.ContentType);
                        var extractTask = _diService.ExtractActaAsync(image.FileName, bytes);

                        await Task.WhenAll(uploadTask, extractTask);

                        var extraction = extractTask.Result;
                        var validations = _validationService.Validate(extraction);
                        var queue = _queueService.AssignQueue(extraction, validations);

                        var entityField = extraction.Fields.FirstOrDefault(f => f.Name == "entidad");
                        var municipalityField = extraction.Fields.FirstOrDefault(f => f.Name == "municipio");
                        var sectionField = extraction.Fields.FirstOrDefault(f => f.Name == "seccion");
                        var distritoField = extraction.Fields.FirstOrDefault(f => f.Name == "distrito");

                        var acta = new Acta
                        {
                            ActaId = image.FileName,
                            Entity = entityField?.Value ?? string.Empty,
                            Municipality = municipalityField?.Value ?? string.Empty,
                            Section = sectionField?.Value ?? string.Empty,
                            GlobalConfidence = extraction.GlobalConfidence,
                            ConfidenceLevel = extraction.GlobalLevel,
                            ArithmeticValidationOk = validations.All(v => v.Passed),
                            Status = "Pending",
                            AssignedQueue = queue,
                            IngestedAt = DateTime.UtcNow
                        };


                        db.Actas.Add(acta);
                        await db.SaveChangesAsync();

                        var actaFields = extraction.Fields.Select(f => new ActaField
                        {
                            ActaId = acta.Id,
                            FieldName = f.Name,
                            NumericValue = int.TryParse(f.Value, out var parsed) ? parsed : null,
                            TextValue = int.TryParse(f.Value, out _) ? null : f.Value,
                            Confidence = f.RawConfidence,
                            ConfidenceLevel = f.Level,
                            BoundingRegion = f.BoundingRegion
                        }).ToList();

                        db.ActaFields.AddRange(actaFields);
                        validations.ForEach(v => v.ActaId = acta.Id);
                        db.ActaValidations.AddRange(validations);
                        await db.SaveChangesAsync();

                        lock (lockObj) { uploadedCount++; }
                        _logger.LogInformation("Acta {FileName} processed", image.FileName);
                    }
                    catch (Exception ex)
                    {
                        lock (lockObj) { failedCount++; }
                        _logger.LogError(ex, "Failed to process acta {FileName}", image.FileName);
                    }
                });

                await Task.WhenAll(tasks);
            }

            return new BatchStatusDto
            {
                OperationId = Guid.NewGuid().ToString(),
                Status = failedCount == 0 ? "succeeded" : "partial",
                TotalDocuments = images.Count,
                SucceededDocuments = uploadedCount,
                FailedDocuments = failedCount,
                SkippedDocuments = skippedCount,
                SkippedNames = skippedNames
            };
        }

        public async Task<ActaResponseDto?> GetActaAsync(int id)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            return acta == null ? null : MapToDto(acta);
        }

        public async Task<List<ActaResponseDto>> GetQueueAsync(string? queue, string? status)
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var query = db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .AsQueryable();

            if (!string.IsNullOrEmpty(queue))
                query = query.Where(a => a.AssignedQueue == queue);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var actas = await query
                .OrderBy(a => a.AssignedQueue == "High" ? 0 : 1)
                .ThenBy(a => a.IngestedAt)
                .ToListAsync();

            return actas.Select(MapToDto).ToList();
        }

        public async Task<ActaResponseDto?> ApproveActaAsync(int id, string approvedBy)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acta == null) return null;

            acta.Status = "Approved";
            acta.ApprovedBy = approvedBy;
            acta.ApprovedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return MapToDto(acta);
        }

        public async Task<ActaResponseDto?> CorrectFieldAsync(int id, CorrectFieldDto dto)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acta == null) return null;

            var field = acta.Fields.FirstOrDefault(f => f.FieldName == dto.FieldName);
            if (field != null)
            {
                if (int.TryParse(dto.NewValue, out var parsed))
                {
                    field.NumericValue = parsed;
                    field.TextValue = null;
                }
                else
                {
                    field.TextValue = dto.NewValue;
                    field.NumericValue = null;
                }

                field.ConfidenceLevel = ConfidenceLevel.High;
                field.Confidence = 1.0f;
            }

            var extraction = new ExtractionResult
            {
                ActaId = acta.ActaId,
                Fields = acta.Fields.Select(f => new ExtractedField
                {
                    Name = f.FieldName,
                    Value = f.TextValue ?? f.NumericValue?.ToString(),
                    RawConfidence = f.Confidence,
                    Level = f.ConfidenceLevel
                }).ToList()
            };

            var newValidations = _validationService.Validate(extraction);
            newValidations.ForEach(v => v.ActaId = acta.Id);

            db.ActaValidations.RemoveRange(acta.Validations);
            db.ActaValidations.AddRange(newValidations);

            acta.ArithmeticValidationOk = newValidations.All(v => v.Passed);
            acta.Status = "InReview";

            await db.SaveChangesAsync();
            return MapToDto(acta);
        }

        public async Task<ActaResponseDto?> RejectActaAsync(int id, string rejectedBy)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acta == null) return null;

            acta.Status = "Rejected";
            acta.ApprovedBy = rejectedBy;
            acta.ApprovedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return MapToDto(acta);
        }

        public async Task<DashboardDto> GetDashboardAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var actas = await db.Actas.ToListAsync();

            return new DashboardDto
            {
                TotalActas = actas.Count,
                Pending = actas.Count(a => a.Status == "Pending"),
                InReview = actas.Count(a => a.Status == "InReview"),
                Approved = actas.Count(a => a.Status == "Approved"),
                Rejected = actas.Count(a => a.Status == "Rejected"),
                HighQueue = actas.Count(a => a.AssignedQueue == "High"),
                StandardQueue = actas.Count(a => a.AssignedQueue == "Standard"),
                WithArithmeticErrors = actas.Count(a => !a.ArithmeticValidationOk),
                WithLowConfidence = actas.Count(a => a.ConfidenceLevel == ConfidenceLevel.Low),
                LastUpdated = DateTime.UtcNow
            };
        }

        public async Task<ActaResponseDto?> RejectByCapturistaAsync(int id, string rejectedBy)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acta == null) return null;

            acta.Status = "RejectedByCapturista";
            acta.ApprovedBy = rejectedBy;
            acta.ApprovedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return MapToDto(acta);
        }

        public async Task<ActaResponseDto?> VerifyApproveAsync(int id, string verifiedBy)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acta == null) return null;

            acta.Status = "Approved";
            acta.ApprovedBy = verifiedBy;
            acta.ApprovedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return MapToDto(acta);
        }

        public async Task<ActaResponseDto?> VerifyRejectAsync(int id, VerifyActaDto dto)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var acta = await db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acta == null) return null;

            acta.Status = "Rejected";
            acta.ApprovedBy = dto.VerifiedBy;
            acta.ApprovedAt = DateTime.UtcNow;
            acta.RejectionReason = dto.RejectionReason;
            acta.RejectionCategory = dto.RejectionCategory;

            if (dto.RejectionCategory == "NoContabilizada")
            {
                foreach (var field in acta.Fields
                    .Where(f => !new[] { "entidad", "municipio", "seccion" }.Contains(f.FieldName)))
                {
                    field.NumericValue = null;
                    field.TextValue = null;
                }
            }

            await db.SaveChangesAsync();
            return MapToDto(acta);
        }

        public async Task<List<ActaResponseDto>> GetVerificadorQueueAsync(string? status)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var query = db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .Where(a => a.Status == "RejectedByCapturista" || a.Status == "InReviewByVerificador")
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var actas = await query.OrderBy(a => a.IngestedAt).ToListAsync();
            return actas.Select(MapToDto).ToList();
        }

        private static ActaResponseDto MapToDto(Acta acta) => new()
        {
            Id = acta.Id,
            ActaId = acta.ActaId,
            Entity = acta.Entity,
            Municipality = acta.Municipality,
            Section = acta.Section,
            GlobalConfidence = acta.GlobalConfidence,
            ConfidenceLevel = acta.ConfidenceLevel.ToString(),
            Status = acta.Status,
            AssignedQueue = acta.AssignedQueue,
            ArithmeticValidationOk = acta.ArithmeticValidationOk,
            IngestedAt = acta.IngestedAt,
            ApprovedBy = acta.ApprovedBy,
            ApprovedAt = acta.ApprovedAt,
            RejectionReason = acta.RejectionReason,
            RejectionCategory = acta.RejectionCategory,
            District = acta.District,
            ImageUrl = $"https://prepactasstoragedos.blob.core.windows.net/actas-entrenamiento/{acta.ActaId}",
            Fields = acta.Fields.Select(f => new FieldResponseDto
            {
                Name = f.FieldName,
                Value = f.TextValue ?? f.NumericValue?.ToString(),
                Confidence = f.Confidence,
                ConfidenceLevel = f.ConfidenceLevel.ToString(),
                BoundingRegion = f.BoundingRegion
            }).ToList(),
            Validations = acta.Validations.Select(v => new ValidationResponseDto
            {
                RuleName = v.RuleName,
                Passed = v.Passed,
                Detail = v.Detail
            }).ToList()
        };
    }
}