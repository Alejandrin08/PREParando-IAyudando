using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using PrepApi.Data;
using PrepApi.Services.Implementations;
using PrepApi.Services.Interfaces;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    )
);

builder.Services.AddHttpClient();
builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
builder.Services.AddScoped<IDocumentIntelligenceService, DocumentIntelligenceService>();
builder.Services.AddScoped<IValidationService, ValidationService>();
builder.Services.AddScoped<IQueueService, QueueService>();
builder.Services.AddScoped<IActaOrchestrationService, ActaOrchestrationService>();
builder.Services.AddScoped<IPublicResultsService, PublicResultsService>();

builder.Services.AddControllers();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100_000_000;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("FrontendPolicy");
app.UseAuthorization();
app.MapControllers();

app.Run();