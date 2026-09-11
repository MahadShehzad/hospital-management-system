using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public sealed class PatientsController(PatientDirectoryService patients) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Doctor,Receptionist,Admin")]
    public async Task<ActionResult<IReadOnlyList<PatientSummaryDto>>> Search([FromQuery] string? q, CancellationToken ct) =>
        Ok(await patients.SearchAsync(q, ct));

    [HttpGet("me")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<PatientProfileDto>> Me(CancellationToken ct) =>
        Ok(await patients.GetMineAsync(ct));

    [HttpPut("me")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<PatientProfileDto>> UpdateMe(UpdatePatientProfileRequest request, CancellationToken ct) =>
        Ok(await patients.UpdateMineAsync(request, ct));

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Doctor,Receptionist,Admin")]
    public async Task<ActionResult<PatientProfileDto>> Get(int id, CancellationToken ct) =>
        Ok(await patients.GetAsync(id, ct));

    [HttpPost("walk-in")]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<WalkInRegisteredDto>> RegisterWalkIn(RegisterWalkInRequest request, CancellationToken ct)
    {
        var (profile, password) = await patients.RegisterWalkInAsync(request, ct);
        return Ok(new WalkInRegisteredDto(profile, password));
    }
}
