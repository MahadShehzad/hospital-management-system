using System.Security.Cryptography;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Hospital.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class AdminService(AppDbContext db, IPasswordHasher hasher)
{
    // ---------- Departments ----------

    public async Task<IReadOnlyList<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct) =>
        await db.Departments.OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Description))
            .ToListAsync(ct);

    public async Task<DepartmentDto> CreateDepartmentAsync(SaveDepartmentRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (await db.Departments.AnyAsync(d => d.Name == name, ct))
            throw new BusinessRuleException("A department with that name already exists.");

        var dept = new Department { Name = name, Description = request.Description?.Trim() };
        db.Departments.Add(dept);
        await db.SaveChangesAsync(ct);
        return new DepartmentDto(dept.Id, dept.Name, dept.Description);
    }

    public async Task<DepartmentDto> UpdateDepartmentAsync(int id, SaveDepartmentRequest request, CancellationToken ct)
    {
        var dept = await db.Departments.FindAsync([id], ct) ?? throw new KeyNotFoundException("Department not found.");
        var name = request.Name.Trim();
        if (await db.Departments.AnyAsync(d => d.Name == name && d.Id != id, ct))
            throw new BusinessRuleException("A department with that name already exists.");

        dept.Name = name;
        dept.Description = request.Description?.Trim();
        await db.SaveChangesAsync(ct);
        return new DepartmentDto(dept.Id, dept.Name, dept.Description);
    }

    public async Task DeleteDepartmentAsync(int id, CancellationToken ct)
    {
        var dept = await db.Departments.FindAsync([id], ct) ?? throw new KeyNotFoundException("Department not found.");
        if (await db.Doctors.AnyAsync(d => d.DepartmentId == id, ct))
            throw new BusinessRuleException("Move or remove the department's doctors first.");
        db.Departments.Remove(dept);
        await db.SaveChangesAsync(ct);
    }

    // ---------- Staff ----------

    public async Task<IReadOnlyList<StaffDto>> GetStaffAsync(UserRole? role, CancellationToken ct)
    {
        var query = db.Users
            .Where(u => u.Role != UserRole.Patient)
            .Include(u => u.Doctor).ThenInclude(d => d!.Department)
            .AsQueryable();

        if (role is { } r) query = query.Where(u => u.Role == r);

        var users = await query.OrderBy(u => u.Role).ThenBy(u => u.FullName).ToListAsync(ct);
        return users.Select(ToStaffDto).ToList();
    }

    public async Task<CreatedStaffDto> CreateStaffAsync(CreateStaffRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (request.Role == UserRole.Patient)
            throw new BusinessRuleException("Use patient registration for patients.");
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new BusinessRuleException("An account with that email already exists.");

        var password = string.IsNullOrWhiteSpace(request.Password)
            ? GeneratePassword()
            : request.Password;

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone.Trim(),
            Role = request.Role,
            PasswordHash = hasher.Hash(password),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        if (request.Role == UserRole.Doctor)
        {
            if (request.DepartmentId is not { } deptId || !await db.Departments.AnyAsync(d => d.Id == deptId, ct))
                throw new BusinessRuleException("A valid department is required for a doctor.");

            db.Doctors.Add(new Doctor
            {
                UserId = user.Id,
                DepartmentId = deptId,
                Specialization = request.Specialization?.Trim() ?? "General",
                Qualifications = request.Qualifications?.Trim(),
                ExperienceYears = request.ExperienceYears,
                ConsultationFee = request.ConsultationFee,
                FollowUpFee = request.FollowUpFee,
                ProcedureFee = request.ProcedureFee,
                SurgeryFee = request.SurgeryFee,
                Bio = request.Bio?.Trim(),
            });
            await db.SaveChangesAsync(ct);
        }

        var staff = await LoadStaffAsync(user.Id, ct);
        return new CreatedStaffDto(staff, password);
    }

    public async Task<StaffDto> UpdateStaffAsync(int userId, UpdateStaffRequest request, CancellationToken ct)
    {
        var user = await db.Users.Include(u => u.Doctor)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role != UserRole.Patient, ct)
            ?? throw new KeyNotFoundException("Staff member not found.");

        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone.Trim();
        user.IsActive = request.IsActive;

        if (user.Doctor is { } doctor)
        {
            if (request.DepartmentId is { } deptId)
            {
                if (!await db.Departments.AnyAsync(d => d.Id == deptId, ct))
                    throw new BusinessRuleException("Department not found.");
                doctor.DepartmentId = deptId;
            }
            if (request.Specialization is { } spec) doctor.Specialization = spec.Trim();
            if (request.Qualifications is { } q) doctor.Qualifications = q.Trim();
            if (request.ExperienceYears is { } years) doctor.ExperienceYears = years;
            if (request.ConsultationFee is { } fee) doctor.ConsultationFee = fee;
            if (request.FollowUpFee is { } fuf) doctor.FollowUpFee = fuf;
            if (request.ProcedureFee is { } pf) doctor.ProcedureFee = pf;
            if (request.SurgeryFee is { } sf) doctor.SurgeryFee = sf;
            if (request.Bio is { } bio) doctor.Bio = bio.Trim();
        }

        await db.SaveChangesAsync(ct);
        return await LoadStaffAsync(userId, ct);
    }

    public async Task SetStaffActiveAsync(int userId, bool active, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Role != UserRole.Patient, ct)
            ?? throw new KeyNotFoundException("Staff member not found.");
        user.IsActive = active;
        await db.SaveChangesAsync(ct);
    }

    private async Task<StaffDto> LoadStaffAsync(int userId, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.Doctor).ThenInclude(d => d!.Department)
            .FirstAsync(u => u.Id == userId, ct);
        return ToStaffDto(user);
    }

    private static StaffDto ToStaffDto(User u) => new(
        u.Id,
        u.Doctor?.Id,
        u.FullName,
        u.Email,
        u.Phone,
        u.Role,
        u.IsActive,
        u.Doctor?.Specialization,
        u.Doctor?.DepartmentId,
        u.Doctor?.Department?.Name,
        u.Doctor?.ExperienceYears,
        u.Doctor?.ConsultationFee,
        u.Doctor?.FollowUpFee,
        u.Doctor?.ProcedureFee,
        u.Doctor?.SurgeryFee,
        u.CreatedAt);

    private static string GeneratePassword() =>
        "Hc" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(6)).Replace("+", "x").Replace("/", "y") + "9!";
}
