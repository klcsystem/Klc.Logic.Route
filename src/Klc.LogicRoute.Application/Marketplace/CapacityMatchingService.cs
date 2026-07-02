using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Marketplace;

public interface ICapacityMatchingService
{
    Task<IEnumerable<CapacityListing>> FindMatchesAsync(string originCity, string destinationCity, DateTime date, decimal weightKg);
    Task<CapacityMatch> RequestMatchAsync(Guid listingId, Guid requestingTenantId, decimal requestedWeightKg, string? createdBy);
    Task<CapacityMatch> AcceptMatchAsync(Guid matchId, Guid ownerTenantId);
    Task<CapacityMatch> RejectMatchAsync(Guid matchId, Guid ownerTenantId);
}

public class CapacityMatchingService(ICapacityListingRepository repository) : ICapacityMatchingService
{
    public async Task<IEnumerable<CapacityListing>> FindMatchesAsync(string originCity, string destinationCity, DateTime date, decimal weightKg)
    {
        var results = await repository.SearchAsync(originCity, destinationCity, date, weightKg);
        return results;
    }

    public async Task<CapacityMatch> RequestMatchAsync(Guid listingId, Guid requestingTenantId, decimal requestedWeightKg, string? createdBy)
    {
        var listing = await repository.GetByIdAsync(listingId);
        if (listing == null)
            throw new InvalidOperationException("Listing bulunamadı");
        if (listing.Status != CapacityListingStatus.Available)
            throw new InvalidOperationException("Listing müsait değil");
        if (requestedWeightKg > listing.AvailableWeightKg)
            throw new InvalidOperationException("İstenen ağırlık mevcut kapasiteyi aşıyor");

        var match = new CapacityMatch
        {
            TenantId = listing.TenantId,
            ListingId = listingId,
            RequestingTenantId = requestingTenantId,
            RequestedWeightKg = requestedWeightKg,
            MatchStatus = CapacityMatchStatus.Pending,
            AgreedPrice = listing.PricePerKg * requestedWeightKg,
            CreatedBy = createdBy
        };

        await repository.InsertMatchAsync(match);
        return match;
    }

    public async Task<CapacityMatch> AcceptMatchAsync(Guid matchId, Guid ownerTenantId)
    {
        var match = await repository.GetMatchByIdAsync(matchId);
        if (match == null)
            throw new InvalidOperationException("Match bulunamadı");

        var listing = await repository.GetByIdAsync(match.ListingId);
        if (listing == null || listing.TenantId != ownerTenantId)
            throw new InvalidOperationException("Bu match üzerinde yetkiniz yok");

        await repository.UpdateMatchStatusAsync(matchId, (int)CapacityMatchStatus.Accepted, match.AgreedPrice);
        await repository.UpdateStatusAsync(listing.Id, (int)CapacityListingStatus.Matched);

        match.MatchStatus = CapacityMatchStatus.Accepted;
        return match;
    }

    public async Task<CapacityMatch> RejectMatchAsync(Guid matchId, Guid ownerTenantId)
    {
        var match = await repository.GetMatchByIdAsync(matchId);
        if (match == null)
            throw new InvalidOperationException("Match bulunamadı");

        var listing = await repository.GetByIdAsync(match.ListingId);
        if (listing == null || listing.TenantId != ownerTenantId)
            throw new InvalidOperationException("Bu match üzerinde yetkiniz yok");

        await repository.UpdateMatchStatusAsync(matchId, (int)CapacityMatchStatus.Rejected, null);

        match.MatchStatus = CapacityMatchStatus.Rejected;
        return match;
    }
}
