using Microsoft.EntityFrameworkCore;
using PrepApi.Data;
using PrepApi.DTOs;
using PrepApi.Models;
using PrepApi.Services.Interfaces;

namespace PrepApi.Services.Implementations
{
    public class PublicResultsService : IPublicResultsService
    {
        private readonly AppDbContext _db;

        private static readonly HashSet<string> PartyFields = new()
        {
            "votos_pan", "votos_pri", "votos_morena", "votos_prd",
            "votos_mc", "votos_pt", "votos_pvem",
            "votos_coalicion_pan_pri_prd", "votos_coalicion_pan_pri",
            "votos_coalicion_pri_prd", "votos_coalicion_pan_prd",
            "votos_coalicion_pvem_pt_morena", "votos_coalicion_pt_morena",
            "votos_coalicion_pvem_morena", "votos_coalicion_pvem_pt",
            "votos_candidatos_no_registrados", "votos_nulos"
        };

        private static readonly HashSet<string> ControlFields = new()
        {
            "total_votos", "total_votos_urnas", "total_personas_votaron",
            "boletas_sobrantes", "lista_nominal"
        };

        public PublicResultsService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<PublicResultDto>> GetResultsAsync(
            string? entity,
            string? municipality,
            string? section,
            string? party,
            string? status)
        {
            var query = _db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .AsQueryable();

            if (!string.IsNullOrEmpty(entity))
                query = query.Where(a => a.Entity.ToLower().Contains(entity.ToLower()));

            if (!string.IsNullOrEmpty(municipality))
                query = query.Where(a => a.Municipality.ToLower().Contains(municipality.ToLower()));

            if (!string.IsNullOrEmpty(section))
                query = query.Where(a => a.Section == section);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var actas = await query
                .OrderBy(a => a.Entity)
                .ThenBy(a => a.Municipality)
                .ThenBy(a => a.Section)
                .ToListAsync();

            if (!string.IsNullOrEmpty(party))
            {
                actas = actas.Where(a =>
                    a.Fields.Any(f =>
                        f.FieldName == party &&
                        f.NumericValue.HasValue &&
                        f.NumericValue > 0
                    )
                ).ToList();
            }

            return actas.Select(a => MapToPublicDto(a)).ToList();
        }

        public async Task<List<EntitySummaryDto>> GetResultsByEntityAsync()
        {
            var actas = await _db.Actas
                .Include(a => a.Fields)
                .ToListAsync();

            var grouped = actas.GroupBy(a => a.Entity);

            var summaries = new List<EntitySummaryDto>();

            foreach (var group in grouped)
            {
                var approvedActas = group.Where(a => a.Status == "Approved").ToList();

                var partyTotals = new Dictionary<string, int>();

                foreach (var acta in approvedActas)
                {
                    foreach (var field in acta.Fields.Where(f => PartyFields.Contains(f.FieldName)))
                    {
                        if (!field.NumericValue.HasValue) continue;
                        if (!partyTotals.ContainsKey(field.FieldName))
                            partyTotals[field.FieldName] = 0;
                        partyTotals[field.FieldName] += field.NumericValue.Value;
                    }
                }

                var totalVotes = partyTotals.Values.Sum();

                var ranked = partyTotals
                    .OrderByDescending(kv => kv.Value)
                    .Select(kv => new PartyTotalDto
                    {
                        FieldName = kv.Key,
                        TotalVotes = kv.Value,
                        Percentage = totalVotes > 0
                            ? (float)kv.Value / totalVotes * 100
                            : 0f
                    })
                    .ToList();

                summaries.Add(new EntitySummaryDto
                {
                    Entity = group.Key,
                    TotalSections = group.Count(),
                    ApprovedSections = group.Count(a => a.Status == "Approved"),
                    PendingSections = group.Count(a => a.Status == "Pending"),
                    InReviewSections = group.Count(a => a.Status == "InReview"),
                    RejectedSections = group.Count(a => a.Status == "Rejected"),
                    TotalVotes = totalVotes,
                    PartyTotals = ranked,
                    FirstPlace = ranked.ElementAtOrDefault(0),
                    SecondPlace = ranked.ElementAtOrDefault(1),
                    ThirdPlace = ranked.ElementAtOrDefault(2)
                });
            }

            return summaries.OrderBy(s => s.Entity).ToList();
        }

        public async Task<PublicResultDto?> GetResultDetailAsync(int id)
        {
            var acta = await _db.Actas
                .Include(a => a.Fields)
                .Include(a => a.Validations)
                .FirstOrDefaultAsync(a => a.Id == id);

            return acta == null ? null : MapToPublicDto(acta);
        }

        private static PublicResultDto MapToPublicDto(Acta acta)
        {
            var (publicStatus, publicDetail) = ResolvePublicStatus(acta);

            return new PublicResultDto
            {
                Id = acta.Id,
                Entity = acta.Entity,
                Municipality = acta.Municipality,
                Section = acta.Section,
                Status = acta.Status,
                PublicStatus = publicStatus,
                PublicStatusDetail = publicDetail,
                ImageUrl = $"https://prepactasstorage.blob.core.windows.net/actas-entrenamiento/{acta.ActaId}",
                GlobalConfidence = acta.GlobalConfidence,
                IngestedAt = acta.IngestedAt,
                ApprovedAt = acta.ApprovedAt,
                PartyResults = acta.Fields
                    .Where(f => PartyFields.Contains(f.FieldName))
                    .OrderByDescending(f => f.NumericValue ?? 0)
                    .Select(f => new PartyResultDto
                    {
                        FieldName = f.FieldName,
                        Votes = f.NumericValue,
                        Confidence = f.Confidence
                    })
                    .ToList(),
                ControlFields = acta.Fields
                    .Where(f => ControlFields.Contains(f.FieldName))
                    .Select(f => new ControlFieldDto
                    {
                        FieldName = f.FieldName,
                        Value = f.NumericValue
                    })
                    .ToList()
            };
        }

        private static (string status, string? detail) ResolvePublicStatus(Acta acta)
        {
            return acta.Status switch
            {
                "Approved" => ("Resultados confirmados", null),

                "Pending" => ("En proceso de captura",
                    "Esta casilla aún no ha sido procesada por el sistema."),

                "InReview" => ("En verificación",
                    ResolveReviewDetail(acta)),

                "Rejected" => ("Incidencia documentada",
                    ResolveRejectionDetail(acta)),

                "RejectedByCapturista" => ("En verificación",
                    "Esta acta fue enviada a un proceso de verificación adicional. " +
                    "Los datos se publicarán una vez confirmados por el equipo de verificación."),

                _ => ("Estado desconocido", null)
            };
        }

        private static string ResolveReviewDetail(Acta acta)
        {
            var failedValidations = acta.Validations.Where(v => !v.Passed).ToList();

            if (failedValidations.Any())
            {
                var reasons = failedValidations.Select(v => v.RuleName switch
                {
                    "SumOfVotesMatchesTotal" =>
                        "la suma de votos por partido no coincide con el total declarado en el acta",
                    "TotalVotesMatchUrnas" =>
                        "el total de votos no coincide con el conteo extraído de las urnas",
                    "PersonasVotaronMatchUrnas" =>
                        "el número de personas que votaron no coincide con el total de votos registrados",
                    "TotalVotesDoNotExceedNominal" =>
                        "el total de votos supera el número de ciudadanos en la lista nominal de esta casilla",
                    _ => "se detectó una inconsistencia en los datos del acta"
                });

                return $"Esta casilla está siendo verificada porque {string.Join(" y ", reasons)}. " +
                       "Los datos se publicarán una vez confirmados.";
            }

            if (acta.ConfidenceLevel == ConfidenceLevel.Low)
                return "El sistema detectó dificultades para leer con certeza los datos manuscritos " +
                       "de esta acta. Un revisor está verificando los valores manualmente.";

            return "Esta casilla está siendo verificada. Los datos se publicarán una vez confirmados.";
        }

        private static string ResolveRejectionDetail(Acta acta)
        {
            var failedValidations = acta.Validations.Where(v => !v.Passed).ToList();

            if (failedValidations.Any())
                return "Esta acta presentó inconsistencias aritméticas que no pudieron resolverse " +
                       "durante el proceso de captura. Sus datos no forman parte de los resultados " +
                       "preliminares. El conteo oficial tomará en cuenta el acta física.";

            return "Esta acta fue marcada con una incidencia durante el proceso de captura. " +
                   "Sus datos no forman parte de los resultados preliminares. " +
                   "El conteo oficial tomará en cuenta el acta física.";
        }
    }
}