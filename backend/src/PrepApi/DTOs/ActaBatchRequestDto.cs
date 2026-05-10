namespace PrepApi.DTOs
{
    public class ActaBatchRequestDto
    {
        public List<IFormFile> Images { get; set; } = new();
    }
}