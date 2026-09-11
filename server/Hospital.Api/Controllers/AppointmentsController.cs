using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public sealed class AppointmentsController(AppointmentService appointments) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> Mine(CancellationToken ct) =>
        Ok(await appointments.GetMineAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> Get(int id, CancellationToken ct) =>
        Ok(await appointments.GetAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<AppointmentDto>> Book(BookAppointmentRequest request, CancellationToken ct)
    {
        var created = await appointments.BookAsync(request, ct);
        return CreatedAtAction(nameof(Mine), new { }, created);
    }

    [HttpPost("for/{patientId:int}")]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<AppointmentDto>> BookFor(int patientId, BookAppointmentRequest request, CancellationToken ct) =>
        Ok(await appointments.BookForAsync(patientId, request, ct));

    [HttpPatch("{id:int}/reschedule")]
    [Authorize(Roles = "Patient,Receptionist,Admin")]
    public async Task<ActionResult<AppointmentDto>> Reschedule(int id, RescheduleAppointmentRequest request, CancellationToken ct) =>
        Ok(await appointments.RescheduleAsync(id, request, ct));

    [HttpPatch("{id:int}/cancel")]
    public async Task<ActionResult<AppointmentDto>> Cancel(int id, CancelAppointmentRequest request, CancellationToken ct) =>
        Ok(await appointments.CancelAsync(id, request, ct));

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Doctor,Receptionist,Admin")]
    public async Task<ActionResult<AppointmentDto>> ChangeStatus(int id, ChangeStatusRequest request, CancellationToken ct) =>
        Ok(await appointments.ChangeStatusAsync(id, request, ct));
}
