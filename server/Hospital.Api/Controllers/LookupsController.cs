using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public sealed class LookupsController(DoctorService doctors) : ControllerBase
{
    [HttpGet("departments")]
    public async Task<ActionResult<IReadOnlyList<DepartmentDto>>> Departments(CancellationToken ct) =>
        Ok(await doctors.GetDepartmentsAsync(ct));

    [HttpGet("specializations")]
    public async Task<ActionResult<IReadOnlyList<string>>> Specializations(CancellationToken ct) =>
        Ok(await doctors.GetSpecializationsAsync(ct));
}
