using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.ExternalServices.Traffic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/traffic")]
[Authorize]
public class TrafficController(
    ITrafficProfileProvider trafficProfile,
    IbbTrafficImportService importService) : ControllerBase
{
    /// <summary>Yüklü trafik profili istatistiği (kaç geohash×saat girdisi var).</summary>
    [HttpGet("profile-stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetProfileStats(CancellationToken ct)
    {
        var count = await trafficProfile.GetProfileCountAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { profileEntries = count }));
    }

    /// <summary>
    /// İBB Açık Veri "hourly traffic density" kaynağından trafik profilini içe aktarır.
    /// resourceId: data.ibb.gov.tr üzerindeki aylık kaynak id'si.
    /// </summary>
    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<IbbImportResult>>> Import(
        [FromQuery] string resourceId, [FromQuery] int maxRecords = 100_000, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(resourceId))
            return BadRequest(ApiResponse<IbbImportResult>.Fail("resourceId gerekli (data.ibb.gov.tr kaynak id'si)"));

        var result = await importService.ImportAsync(resourceId, maxRecords, ct);
        return Ok(ApiResponse<IbbImportResult>.Ok(result));
    }
}
