using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/doctors")]
[Authorize]
public sealed class DoctorsController(DoctorService doctors, SlotService slots) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<DoctorListItemDto>>> Search(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] string? specialization,
        [FromQuery] double? minRating,
        [FromQuery] DateOnly? availableOn,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var query = new DoctorQuery(search, departmentId, specialization, minRating, availableOn, page, pageSize);
        return Ok(await doctors.SearchAsync(query, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DoctorDetailDto>> Get(int id, CancellationToken ct) =>
        Ok(await doctors.GetAsync(id, ct));

    [HttpGet("{id:int}/slots")]
    public async Task<ActionResult<IReadOnlyList<SlotDto>>> Slots(
        int id,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct = default)
    {
        var start = from ?? DateOnly.FromDateTime(DateTime.Now);
        var end = to ?? start.AddDays(13);

        if (end < start)
            return BadRequest("'to' must be on or after 'from'.");
        if (end.DayNumber - start.DayNumber > 30)
            return BadRequest("Date range cannot exceed 31 days.");

        return Ok(await slots.GetOpenSlotsAsync(id, start, end, ct));
    }
}
