using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/me/availability")]
[Authorize(Roles = "Doctor")]
public sealed class DoctorAvailabilityController(AvailabilityService availability) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AvailabilityDto>>> List(CancellationToken ct) =>
        Ok(await availability.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<AvailabilityDto>> Add(SaveAvailabilityRequest request, CancellationToken ct) =>
        Ok(await availability.AddAsync(request, ct));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AvailabilityDto>> Update(int id, SaveAvailabilityRequest request, CancellationToken ct) =>
        Ok(await availability.UpdateAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await availability.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpGet("time-off")]
    public async Task<ActionResult<IReadOnlyList<TimeOffDto>>> TimeOff(CancellationToken ct) =>
        Ok(await availability.ListTimeOffAsync(ct));

    [HttpPut("time-off")]
    public async Task<ActionResult<TimeOffDto>> SaveTimeOff(SaveTimeOffRequest request, CancellationToken ct) =>
        Ok(await availability.SaveTimeOffAsync(request, ct));

    [HttpDelete("time-off/{id:int}")]
    public async Task<IActionResult> DeleteTimeOff(int id, CancellationToken ct)
    {
        await availability.DeleteTimeOffAsync(id, ct);
        return NoContent();
    }
}
