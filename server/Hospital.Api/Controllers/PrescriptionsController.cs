using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public sealed class PrescriptionsController(PrescriptionService prescriptions) : ControllerBase
{
    [HttpGet("appointments/{appointmentId:int}/prescription")]
    public async Task<ActionResult<PrescriptionDto>> ForAppointment(int appointmentId, CancellationToken ct)
    {
        var result = await prescriptions.GetByAppointmentAsync(appointmentId, ct);
        return result is null ? NoContent() : Ok(result);
    }

    [HttpPut("appointments/{appointmentId:int}/prescription")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<PrescriptionDto>> Save(int appointmentId, SavePrescriptionRequest request, CancellationToken ct) =>
        Ok(await prescriptions.SaveAsync(appointmentId, request, ct));

    [HttpGet("prescriptions/mine")]
    public async Task<ActionResult<IReadOnlyList<PrescriptionDto>>> Mine(CancellationToken ct) =>
        Ok(await prescriptions.GetMineAsync(ct));
}
