using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.Services;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream stream, string fileName, string subFolder = "pod");
}

public class FileStorageService(ILogger<FileStorageService> logger) : IFileStorageService
{
    private static readonly string BasePath = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "uploads");

    public async Task<string> SaveAsync(Stream stream, string fileName, string subFolder = "pod")
    {
        var directory = Path.Combine(BasePath, subFolder);
        Directory.CreateDirectory(directory);

        // Generate unique file name to avoid collisions
        var ext = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(directory, uniqueName);

        await using var fileStream = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fileStream);

        var relativePath = $"/uploads/{subFolder}/{uniqueName}";
        logger.LogInformation("File saved: {FilePath}", relativePath);
        return relativePath;
    }
}
