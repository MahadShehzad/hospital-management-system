using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public sealed class SettingsController(SettingsService settings) : ControllerBase
{
    [HttpGet("settings")]
    public async Task<ActionResult<ClinicSettingsDto>> Get(CancellationToken ct) =>
        Ok(await settings.GetAsync(ct));

    [HttpPut("settings")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClinicSettingsDto>> Update(ClinicSettingsDto dto, CancellationToken ct) =>
        Ok(await settings.UpdateAsync(dto, ct));

    [HttpGet("holidays")]
    public async Task<ActionResult<IReadOnlyList<HolidayDto>>> Holidays(CancellationToken ct) =>
        Ok(await settings.GetHolidaysAsync(ct));

    [HttpPost("holidays")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HolidayDto>> AddHoliday(SaveHolidayRequest request, CancellationToken ct) =>
        Ok(await settings.AddHolidayAsync(request, ct));

    [HttpDelete("holidays/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHoliday(int id, CancellationToken ct)
    {
        await settings.DeleteHolidayAsync(id, ct);
        return NoContent();
    }
}
