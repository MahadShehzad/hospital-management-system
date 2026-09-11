using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController(DashboardService dashboard) : ControllerBase
{
    [HttpGet("doctor")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<DoctorDashboardDto>> Doctor(CancellationToken ct) =>
        Ok(await dashboard.DoctorAsync(ct));

    [HttpGet("reception")]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<ReceptionDashboardDto>> Reception(CancellationToken ct) =>
        Ok(await dashboard.ReceptionAsync(ct));
}
