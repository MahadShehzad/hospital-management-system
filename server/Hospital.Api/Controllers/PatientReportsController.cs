using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class PatientReportsController(PatientReportService reports) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PatientReportDto>>> Search(
        [FromQuery] int? patientId,
        [FromQuery] int? doctorId,
        [FromQuery] int? year,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? search,
        CancellationToken ct) =>
        Ok(await reports.SearchAsync(patientId, doctorId, year, from, to, search, ct));

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<PatientReportDto>> Create(SavePatientReportRequest request, CancellationToken ct) =>
        Ok(await reports.CreateAsync(request, ct));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<ActionResult<PatientReportDto>> Update(int id, SavePatientReportRequest request, CancellationToken ct) =>
        Ok(await reports.UpdateAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await reports.DeleteAsync(id, ct);
        return NoContent();
    }
}
