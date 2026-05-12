using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using PrepApi.Services.Interfaces;

namespace PrepApi.Services.Implementations
{
    public class BlobStorageService : IBlobStorageService
    {
        private readonly BlobContainerClient _containerClient;
        private readonly ILogger<BlobStorageService> _logger;

        public BlobStorageService(IConfiguration configuration, ILogger<BlobStorageService> logger)
        {
            _logger = logger;

            var connectionString = configuration["AzureBlobStorage:ConnectionString"]!;
            var containerName = configuration["AzureBlobStorage:ContainerName"]!;

            _containerClient = new BlobContainerClient(connectionString, containerName);
        }

        public async Task<string> UploadActaAsync(string fileName, byte[] imageBytes, string contentType)
        {
            var blobClient = _containerClient.GetBlobClient(fileName);

            using var stream = new MemoryStream(imageBytes);

            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType
                }
            };

            await blobClient.UploadAsync(
                stream,
                uploadOptions,
                cancellationToken: default
            );

            _logger.LogInformation("Uploaded acta {FileName} to blob storage", fileName);

            return blobClient.Uri.ToString();
        }

        public async Task<IEnumerable<string>> UploadBatchAsync(
            IEnumerable<(string FileName, byte[] Bytes, string ContentType)> files)
        {
            var uploadTasks = files.Select(async file =>
            {
                var url = await UploadActaAsync(file.FileName, file.Bytes, file.ContentType);
                return url;
            });

            var urls = await Task.WhenAll(uploadTasks);
            return urls;
        }

        public async Task DeleteActaAsync(string fileName)
        {
            var blobClient = _containerClient.GetBlobClient(fileName);
            await blobClient.DeleteIfExistsAsync();
            _logger.LogInformation("Deleted acta {FileName} from blob storage", fileName);
        }

        public async Task<bool> ExistsAsync(string fileName)
        {
            var blobClient = _containerClient.GetBlobClient(fileName);
            return await blobClient.ExistsAsync();
        }
    }
}