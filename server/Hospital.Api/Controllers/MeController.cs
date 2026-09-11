using Hospital.Api.Auth;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Controllers;

public sealed record MeDto(int UserId, string FullName, UserRole Role, int? DoctorId, int? PatientId);

[ApiController]
[Route("api/me")]
[Authorize]
public sealed class MeController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<MeDto>> Get(CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.Doctor)
            .Include(u => u.Patient)
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        return Ok(new MeDto(user.Id, user.FullName, user.Role, user.Doctor?.Id, user.Patient?.Id));
    }
}
