using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class CapacityListingRepository(IPostgresConnectionFactory connectionFactory) : ICapacityListingRepository
{
    public async Task<CapacityListing?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CapacityListing>(
            "SELECT * FROM logistics.capacity_listings WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<CapacityListing>> GetAllAvailableAsync(int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<CapacityListing>(
            @"SELECT * FROM logistics.capacity_listings
              WHERE status = 0 AND is_deleted = FALSE AND available_date >= @Now
              ORDER BY available_date ASC LIMIT @PageSize OFFSET @Offset",
            new { Now = DateTime.UtcNow.Date, PageSize = pageSize, Offset = offset });
    }

    public async Task<IEnumerable<CapacityListing>> SearchAsync(string? originCity, string? destinationCity, DateTime? date, decimal? minWeightKg)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<CapacityListing>(
            @"SELECT * FROM logistics.capacity_listings
              WHERE status = 0 AND is_deleted = FALSE
              AND (@OriginCity IS NULL OR LOWER(origin_city) = LOWER(@OriginCity))
              AND (@DestinationCity IS NULL OR LOWER(destination_city) = LOWER(@DestinationCity))
              AND (@Date IS NULL OR available_date = @Date)
              AND (@MinWeightKg IS NULL OR available_weight_kg >= @MinWeightKg)
              AND available_date >= @Now
              ORDER BY available_date ASC
              LIMIT 100",
            new { OriginCity = originCity, DestinationCity = destinationCity, Date = date, MinWeightKg = minWeightKg, Now = DateTime.UtcNow.Date });
    }

    public async Task<IEnumerable<CapacityListing>> GetByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<CapacityListing>(
            @"SELECT * FROM logistics.capacity_listings
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<Guid> InsertAsync(CapacityListing l)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.capacity_listings
              (id, tenant_id, origin_city, destination_city, available_date,
               available_weight_kg, available_volume_m3, vehicle_type, price_per_kg,
               status, contact_phone, notes, created_by, created_at)
              VALUES (@Id, @TenantId, @OriginCity, @DestinationCity, @AvailableDate,
               @AvailableWeightKg, @AvailableVolumeM3, @VehicleType, @PricePerKg,
               @Status, @ContactPhone, @Notes, @CreatedBy, @CreatedAt)",
            new
            {
                l.Id, l.TenantId, l.OriginCity, l.DestinationCity, l.AvailableDate,
                l.AvailableWeightKg, l.AvailableVolumeM3, l.VehicleType, l.PricePerKg,
                Status = (int)l.Status, l.ContactPhone, l.Notes, l.CreatedBy, l.CreatedAt
            });
        return l.Id;
    }

    public async Task UpdateAsync(CapacityListing l)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.capacity_listings SET
              origin_city = @OriginCity, destination_city = @DestinationCity,
              available_date = @AvailableDate, available_weight_kg = @AvailableWeightKg,
              available_volume_m3 = @AvailableVolumeM3, vehicle_type = @VehicleType,
              price_per_kg = @PricePerKg, status = @Status, contact_phone = @ContactPhone,
              notes = @Notes, updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id",
            new
            {
                l.Id, l.OriginCity, l.DestinationCity, l.AvailableDate,
                l.AvailableWeightKg, l.AvailableVolumeM3, l.VehicleType, l.PricePerKg,
                Status = (int)l.Status, l.ContactPhone, l.Notes, l.UpdatedBy, Now = DateTime.UtcNow
            });
    }

    public async Task UpdateStatusAsync(Guid id, int status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.capacity_listings SET status = @Status, updated_at = @Now WHERE id = @Id",
            new { Id = id, Status = status, Now = DateTime.UtcNow });
    }

    // Match operations
    public async Task<CapacityMatch?> GetMatchByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CapacityMatch>(
            "SELECT * FROM logistics.capacity_matches WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<CapacityMatch>> GetMatchesByListingAsync(Guid listingId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<CapacityMatch>(
            "SELECT * FROM logistics.capacity_matches WHERE listing_id = @ListingId AND is_deleted = FALSE ORDER BY created_at DESC",
            new { ListingId = listingId });
    }

    public async Task<Guid> InsertMatchAsync(CapacityMatch m)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.capacity_matches
              (id, tenant_id, listing_id, requesting_tenant_id, requested_weight_kg,
               match_status, agreed_price, created_by, created_at)
              VALUES (@Id, @TenantId, @ListingId, @RequestingTenantId, @RequestedWeightKg,
               @MatchStatus, @AgreedPrice, @CreatedBy, @CreatedAt)",
            new
            {
                m.Id, m.TenantId, m.ListingId, m.RequestingTenantId, m.RequestedWeightKg,
                MatchStatus = (int)m.MatchStatus, m.AgreedPrice, m.CreatedBy, m.CreatedAt
            });
        return m.Id;
    }

    public async Task UpdateMatchStatusAsync(Guid matchId, int status, decimal? agreedPrice)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.capacity_matches SET match_status = @Status, agreed_price = @AgreedPrice, updated_at = @Now
              WHERE id = @MatchId",
            new { MatchId = matchId, Status = status, AgreedPrice = agreedPrice, Now = DateTime.UtcNow });
    }
}
