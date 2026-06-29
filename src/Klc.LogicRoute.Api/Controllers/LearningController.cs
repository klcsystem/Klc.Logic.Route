using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Learning;
using Klc.LogicRoute.Application.Learning.Models;
using Klc.LogicRoute.Infrastructure.BackgroundJobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/learning")]
[Authorize]
public class LearningController(
    ILearningService learningService,
    LearningOrchestrator learningOrchestrator,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>
    /// Overall learning stats: how many data points, accuracy improvement.
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<LearningSummary>>> GetSummary()
    {
        var summary = await learningService.GetSummaryAsync();
        return Ok(ApiResponse<LearningSummary>.Ok(summary));
    }

    /// <summary>
    /// All learned service times by location.
    /// </summary>
    [HttpGet("service-times")]
    public async Task<ActionResult<ApiResponse<IEnumerable<LearnedServiceTime>>>> GetServiceTimes()
    {
        var data = await learningService.GetAllServiceTimesAsync();
        return Ok(ApiResponse<IEnumerable<LearnedServiceTime>>.Ok(data));
    }

    /// <summary>
    /// All learned traffic multipliers by hour/day.
    /// </summary>
    [HttpGet("traffic-patterns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<LearnedTrafficPattern>>>> GetTrafficPatterns()
    {
        var data = await learningService.GetAllTrafficPatternsAsync();
        return Ok(ApiResponse<IEnumerable<LearnedTrafficPattern>>.Ok(data));
    }

    /// <summary>
    /// All learned address corrections.
    /// </summary>
    [HttpGet("addresses")]
    public async Task<ActionResult<ApiResponse<IEnumerable<LearnedAddress>>>> GetAddressCorrections()
    {
        var data = await learningService.GetAllAddressCorrectionsAsync();
        return Ok(ApiResponse<IEnumerable<LearnedAddress>>.Ok(data));
    }

    /// <summary>
    /// Manually trigger learning from historical data.
    /// </summary>
    [HttpPost("retrain")]
    [Authorize(Roles = "Admin,LogisticsManager")]
    public async Task<ActionResult<ApiResponse<string>>> Retrain()
    {
        _ = Task.Run(() => learningOrchestrator.TriggerManualRunAsync(CancellationToken.None));
        return Ok(ApiResponse<string>.Ok("Ogrenme sureci baslatildi. Sonuclar birkac dakika icinde guncellenecektir."));
    }

    /// <summary>
    /// Get learned service time for a specific location.
    /// </summary>
    [HttpGet("service-times/lookup")]
    public async Task<ActionResult<ApiResponse<object>>> LookupServiceTime(
        [FromQuery] double lat, [FromQuery] double lng, [FromQuery] DateTime? arrivalTime = null)
    {
        var learned = await learningService.GetLearnedServiceTimeAsync(lat, lng, arrivalTime);
        var result = new
        {
            Lat = lat,
            Lng = lng,
            LearnedServiceTimeMinutes = learned,
            DefaultServiceTimeMinutes = 15.0,
            UsingLearned = learned.HasValue
        };
        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>
    /// Get learned traffic multiplier for a specific time.
    /// </summary>
    [HttpGet("traffic-patterns/lookup")]
    public async Task<ActionResult<ApiResponse<object>>> LookupTrafficMultiplier(
        [FromQuery] int dayOfWeek, [FromQuery] int hour, [FromQuery] string? regionPair = null)
    {
        var day = (DayOfWeek)dayOfWeek;
        var learned = await learningService.GetLearnedTrafficMultiplierAsync(day, hour, regionPair);
        var result = new
        {
            DayOfWeek = day.ToString(),
            Hour = hour,
            RegionPair = regionPair,
            LearnedMultiplier = learned,
            UsingLearned = learned.HasValue
        };
        return Ok(ApiResponse<object>.Ok(result));
    }
}
