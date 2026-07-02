using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContractsController(
    IContractRepository contractRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Contract>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var contracts = await contractRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<Contract>>.Ok(contracts));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Contract>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var contract = await contractRepository.GetByIdAsync(id, tenantId);
        if (contract == null) return NotFound(ApiResponse<Contract>.Fail("Sözleşme bulunamadı"));
        return Ok(ApiResponse<Contract>.Ok(contract));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] Contract contract)
    {
        var tenantId = tenantProvider.GetTenantId();
        contract.TenantId = tenantId;
        contract.CreatedBy = tenantProvider.GetUserId();
        if (string.IsNullOrEmpty(contract.ContractNumber))
            contract.ContractNumber = $"CTR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        var id = await contractRepository.InsertAsync(contract);

        foreach (var rate in contract.Rates)
        {
            rate.ContractId = id;
            rate.TenantId = tenantId;
            rate.CreatedBy = tenantProvider.GetUserId();
            await contractRepository.InsertRateAsync(rate);
        }

        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, [FromBody] Contract contract)
    {
        var tenantId = tenantProvider.GetTenantId();
        contract.Id = id;
        contract.TenantId = tenantId;
        contract.UpdatedBy = tenantProvider.GetUserId();
        await contractRepository.UpdateAsync(contract);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await contractRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    // --- Contract Rates ---

    [HttpGet("{contractId:guid}/rates")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContractRate>>>> GetRates(Guid contractId)
    {
        var rates = await contractRepository.GetRatesAsync(contractId);
        return Ok(ApiResponse<IEnumerable<ContractRate>>.Ok(rates));
    }

    [HttpPost("{contractId:guid}/rates")]
    public async Task<ActionResult<ApiResponse<bool>>> AddRate(Guid contractId, [FromBody] ContractRate rate)
    {
        var tenantId = tenantProvider.GetTenantId();
        rate.ContractId = contractId;
        rate.TenantId = tenantId;
        rate.CreatedBy = tenantProvider.GetUserId();
        await contractRepository.InsertRateAsync(rate);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPut("rates/{rateId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateRate(Guid rateId, [FromBody] ContractRate rate)
    {
        rate.Id = rateId;
        await contractRepository.UpdateRateAsync(rate);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("rates/{rateId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRate(Guid rateId)
    {
        await contractRepository.DeleteRateAsync(rateId);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
