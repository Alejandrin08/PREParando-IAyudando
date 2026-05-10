namespace PrepApi.Services.Interfaces
{
    public interface IBlobStorageService
    {
        Task<string> UploadActaAsync(string fileName, byte[] imageBytes, string contentType);
        Task<IEnumerable<string>> UploadBatchAsync(IEnumerable<(string FileName, byte[] Bytes, string ContentType)> files);
        Task DeleteActaAsync(string fileName);
    }
}