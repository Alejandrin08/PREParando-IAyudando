namespace PrepApi.DTOs
{
    public class CorrectFieldDto
    {
        public string FieldName { get; set; } = string.Empty;
        public string NewValue { get; set; } = string.Empty;
        public string CorrectedBy { get; set; } = string.Empty;
    }
}