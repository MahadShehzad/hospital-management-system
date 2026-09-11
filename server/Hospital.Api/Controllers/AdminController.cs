using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Hospital.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public sealed class AdminController(AdminService admin, ReportService reports) : ControllerBase
{
    // ---- Departments ----
    [HttpPost("departments")]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment(SaveDepartmentRequest request, CancellationToken ct) =>
        Ok(await admin.CreateDepartmentAsync(request, ct));

    [HttpPut("departments/{id:int}")]
    public async Task<ActionResult<DepartmentDto>> UpdateDepartment(int id, SaveDepartmentRequest request, CancellationToken ct) =>
        Ok(await admin.UpdateDepartmentAsync(id, request, ct));

    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDepartment(int id, CancellationToken ct)
    {
        await admin.DeleteDepartmentAsync(id, ct);
        return NoContent();
    }

    // ---- Staff ----
    [HttpGet("staff")]
    public async Task<ActionResult<IReadOnlyList<StaffDto>>> Staff([FromQuery] UserRole? role, CancellationToken ct) =>
        Ok(await admin.GetStaffAsync(role, ct));

    [HttpPost("staff")]
    public async Task<ActionResult<CreatedStaffDto>> CreateStaff(CreateStaffRequest request, CancellationToken ct) =>
        Ok(await admin.CreateStaffAsync(request, ct));

    [HttpPut("staff/{userId:int}")]
    public async Task<ActionResult<StaffDto>> UpdateStaff(int userId, UpdateStaffRequest request, CancellationToken ct) =>
        Ok(await admin.UpdateStaffAsync(userId, request, ct));

    [HttpPatch("staff/{userId:int}/active")]
    public async Task<IActionResult> SetActive(int userId, [FromQuery] bool active, CancellationToken ct)
    {
        await admin.SetStaffActiveAsync(userId, active, ct);
        return NoContent();
    }

    // ---- Reports ----
    [HttpGet("reports")]
    public async Task<ActionResult<AdminReportDto>> Reports(CancellationToken ct) =>
        Ok(await reports.BuildAsync(ct));
}
