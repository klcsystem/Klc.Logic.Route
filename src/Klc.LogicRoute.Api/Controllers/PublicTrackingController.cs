using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.CustomerEta.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/public/tracking")]
[AllowAnonymous]
public class PublicTrackingController(IMediator mediator) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<ActionResult<ApiResponse<PublicTrackingResult>>> GetByToken(string token)
    {
        var result = await mediator.Send(new GetPublicTrackingQuery(token));
        if (result == null)
            return NotFound(ApiResponse<PublicTrackingResult>.Fail("Takip bilgisi bulunamadi"));

        return Ok(ApiResponse<PublicTrackingResult>.Ok(result));
    }
}
