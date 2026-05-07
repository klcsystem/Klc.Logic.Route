using System.Text.Json;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.ML;

namespace Klc.LogicRoute.Application.ML.Pipeline;

public class ModelTrainingJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ModelTrainingJob> _logger;
    private readonly MLContext _mlContext;

    private static readonly string ModelBasePath = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "ml-models");

    public ModelTrainingJob(IServiceScopeFactory scopeFactory, ILogger<ModelTrainingJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _mlContext = new MLContext(seed: 42);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ML Model Training Job started");

        while (!stoppingToken.IsCancellationRequested)
        {
            // Calculate delay until next 3:00 AM
            var now = DateTime.UtcNow;
            var next3Am = now.Date.AddHours(3);
            if (now >= next3Am) next3Am = next3Am.AddDays(1);
            var delay = next3Am - now;

            _logger.LogInformation("Next training scheduled at {Time} (in {Hours:F1} hours)",
                next3Am, delay.TotalHours);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                await TrainModelsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ML model training failed");
            }
        }
    }

    public async Task TrainModelsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var shipmentRepository = scope.ServiceProvider.GetRequiredService<IShipmentRepository>();
        var modelRepository = scope.ServiceProvider.GetRequiredService<IMLModelRepository>();

        // Get all tenants' shipments (simplified — in production, iterate per tenant)
        // For now, use a default tenant
        _logger.LogInformation("Starting ML model training...");

        Directory.CreateDirectory(ModelBasePath);

        await TrainDeliveryTimeModelAsync(shipmentRepository, modelRepository, cancellationToken);

        _logger.LogInformation("ML model training completed");
    }

    private async Task TrainDeliveryTimeModelAsync(
        IShipmentRepository shipmentRepository,
        IMLModelRepository modelRepository,
        CancellationToken cancellationToken)
    {
        // Extract training data from completed shipments
        // Note: In production, this would query all tenants or a specific training dataset
        // For now, we create a synthetic training pipeline
        var features = new List<ShipmentFeatures>();

        // Generate synthetic training data based on Turkish logistics patterns
        var cities = new[] { "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep" };
        var random = new Random(42);

        for (var i = 0; i < 500; i++)
        {
            var origin = cities[random.Next(cities.Length)];
            var dest = cities[random.Next(cities.Length)];
            var weight = (float)(random.NextDouble() * 20000);
            var sameCity = origin == dest;

            features.Add(new ShipmentFeatures
            {
                OriginCity = origin,
                DestinationCity = dest,
                Weight = weight,
                Volume = weight / 300f,
                ProviderId = "synthetic",
                DayOfWeek = random.Next(7),
                Hour = random.Next(24),
                IsHazardous = random.NextDouble() > 0.9 ? 1 : 0,
                RequiresColdChain = random.NextDouble() > 0.85 ? 1 : 0,
                PalletCount = random.Next(1, 33),
                Priority = random.Next(3),
                DeliveryHours = sameCity
                    ? (float)(2 + random.NextDouble() * 4)
                    : (float)(6 + random.NextDouble() * 18 + (weight > 10000 ? 4 : 0))
            });
        }

        var dataView = _mlContext.Data.LoadFromEnumerable(features);

        var pipeline = _mlContext.Transforms.Categorical.OneHotEncoding("OriginCityEncoded", "OriginCity")
            .Append(_mlContext.Transforms.Categorical.OneHotEncoding("DestCityEncoded", "DestinationCity"))
            .Append(_mlContext.Transforms.Concatenate("Features",
                "OriginCityEncoded", "DestCityEncoded", "Weight", "Volume",
                "DayOfWeek", "Hour", "IsHazardous", "RequiresColdChain", "PalletCount", "Priority"))
            .Append(_mlContext.Regression.Trainers.FastTree(
                labelColumnName: "DeliveryHours",
                featureColumnName: "Features",
                numberOfTrees: 100,
                numberOfLeaves: 20,
                minimumExampleCountPerLeaf: 10));

        _logger.LogInformation("Training DeliveryTime model with {Count} records", features.Count);
        var model = pipeline.Fit(dataView);

        // Evaluate
        var predictions = model.Transform(dataView);
        var metrics = _mlContext.Regression.Evaluate(predictions, labelColumnName: "DeliveryHours");

        _logger.LogInformation("DeliveryTime model — R²: {R2:F3}, RMSE: {RMSE:F2}",
            metrics.RSquared, metrics.RootMeanSquaredError);

        // Save model
        var version = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var modelPath = Path.Combine(ModelBasePath, $"delivery-time-{version}.zip");
        _mlContext.Model.Save(model, dataView.Schema, modelPath);

        // Deactivate previous models and save new metadata
        // Use a default tenant ID for global model
        var defaultTenantId = Guid.Empty;
        await modelRepository.DeactivateAllAsync("DeliveryTime", defaultTenantId);
        await modelRepository.CreateAsync(new MLModelMetadata
        {
            TenantId = defaultTenantId,
            ModelType = "DeliveryTime",
            ModelVersion = version,
            FilePath = modelPath,
            Metrics = JsonSerializer.Serialize(new
            {
                metrics.RSquared,
                metrics.RootMeanSquaredError,
                metrics.MeanAbsoluteError,
                metrics.MeanSquaredError
            }),
            TrainingRecords = features.Count,
            IsActive = true,
            TrainedAt = DateTime.UtcNow
        });

        _logger.LogInformation("DeliveryTime model saved: {Path}", modelPath);
    }
}
