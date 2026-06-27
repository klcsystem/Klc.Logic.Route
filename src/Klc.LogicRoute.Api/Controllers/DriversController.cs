using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.DriverSkillMatching;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DriversController(IDriverRepository driverRepository, IDriverSkillMatcher driverSkillMatcher, ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? providerId)
    {
        var drivers = await driverRepository.GetAllAsync(tenantProvider.GetTenantId(), providerId);
        return Ok(ApiResponse<List<Driver>>.Ok(drivers));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var driver = await driverRepository.GetByIdAsync(id);
        return driver == null ? NotFound() : Ok(ApiResponse<Driver>.Ok(driver));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Driver driver)
    {
        driver.TenantId = tenantProvider.GetTenantId();
        var id = await driverRepository.InsertAsync(driver);
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Driver driver)
    {
        driver.Id = id;
        await driverRepository.UpdateAsync(driver);
        return Ok(ApiResponse<string>.Ok("Updated"));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await driverRepository.DeleteAsync(id);
        return Ok(ApiResponse<string>.Ok("Deleted"));
    }

    /// <summary>
    /// Matches drivers to stops based on required certifications (ADR, Frigo, Heavy).
    /// </summary>
    [HttpPost("match-skills")]
    public async Task<IActionResult> MatchSkills([FromBody] List<DriverStopRequirement> stops)
    {
        var tenantId = tenantProvider.GetTenantId();
        var drivers = await driverRepository.GetAllAsync(tenantId);
        var result = driverSkillMatcher.MatchDriversToStops(stops, drivers);
        return Ok(ApiResponse<DriverMatchResult>.Ok(result));
    }

    /// <summary>
    /// Gets eligible drivers for a shipment based on hazardous/cold-chain/heavy flags.
    /// </summary>
    [HttpGet("eligible")]
    public async Task<IActionResult> GetEligible([FromQuery] bool isHazardous = false, [FromQuery] bool requiresColdChain = false, [FromQuery] bool isHeavy = false)
    {
        var tenantId = tenantProvider.GetTenantId();
        var drivers = await driverRepository.GetAllAsync(tenantId);
        var eligible = driverSkillMatcher.GetEligibleDrivers(isHazardous, requiresColdChain, isHeavy, drivers);
        return Ok(ApiResponse<List<Driver>>.Ok(eligible));
    }
}
