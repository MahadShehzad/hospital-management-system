using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/queue")]
[Authorize(Roles = "Doctor,Receptionist,Admin")]
public sealed class QueueController(QueueService queue) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QueueEntryDto>>> Today([FromQuery] int? doctorId, CancellationToken ct) =>
        Ok(await queue.GetTodayAsync(doctorId, ct));

    [HttpPost]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<QueueEntryDto>> Add(AddToQueueRequest request, CancellationToken ct) =>
        Ok(await queue.AddAsync(request, ct));

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<QueueEntryDto>> UpdateStatus(int id, UpdateQueueStatusRequest request, CancellationToken ct) =>
        Ok(await queue.UpdateStatusAsync(id, request.Status, ct));

    [HttpPost("call-next")]
    public async Task<ActionResult<QueueEntryDto>> CallNext([FromQuery] int doctorId, CancellationToken ct)
    {
        var next = await queue.CallNextAsync(doctorId, ct);
        return next is null ? NoContent() : Ok(next);
    }
}
