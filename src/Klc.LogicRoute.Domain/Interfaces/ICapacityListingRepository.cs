using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ICapacityListingRepository
{
    Task<CapacityListing?> GetByIdAsync(Guid id);
    Task<IEnumerable<CapacityListing>> GetAllAvailableAsync(int page = 1, int pageSize = 50);
    Task<IEnumerable<CapacityListing>> SearchAsync(string? originCity, string? destinationCity, DateTime? date, decimal? minWeightKg);
    Task<IEnumerable<CapacityListing>> GetByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<Guid> InsertAsync(CapacityListing listing);
    Task UpdateAsync(CapacityListing listing);
    Task UpdateStatusAsync(Guid id, int status);

    // Match operations
    Task<CapacityMatch?> GetMatchByIdAsync(Guid id);
    Task<IEnumerable<CapacityMatch>> GetMatchesByListingAsync(Guid listingId);
    Task<Guid> InsertMatchAsync(CapacityMatch match);
    Task UpdateMatchStatusAsync(Guid matchId, int status, decimal? agreedPrice);
}
