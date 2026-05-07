using Microsoft.Extensions.Logging;
using Microsoft.ML;

namespace Klc.LogicRoute.Infrastructure.ML;

public interface IMLModelStore
{
    ITransformer? LoadModel(string modelPath, out DataViewSchema? schema);
    string GetModelDirectory();
}

public class MLNetModelStore : IMLModelStore
{
    private readonly MLContext _mlContext;
    private readonly ILogger<MLNetModelStore> _logger;
    private static readonly string ModelBasePath = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "ml-models");

    public MLNetModelStore(ILogger<MLNetModelStore> logger)
    {
        _logger = logger;
        _mlContext = new MLContext(seed: 42);
        Directory.CreateDirectory(ModelBasePath);
    }

    public ITransformer? LoadModel(string modelPath, out DataViewSchema? schema)
    {
        schema = null;
        if (!File.Exists(modelPath))
        {
            _logger.LogWarning("ML model not found: {Path}", modelPath);
            return null;
        }

        try
        {
            var model = _mlContext.Model.Load(modelPath, out var inputSchema);
            schema = inputSchema;
            _logger.LogInformation("ML model loaded: {Path}", modelPath);
            return model;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load ML model: {Path}", modelPath);
            return null;
        }
    }

    public string GetModelDirectory() => ModelBasePath;
}
