using Hospital.Api.Contracts;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed record DoctorQuery(
    string? Search,
    int? DepartmentId,
    string? Specialization,
    double? MinRating,
    DateOnly? AvailableOn,
    int Page = 1,
    int PageSize = 12);

public sealed class DoctorService(AppDbContext db, SlotService slots)
{
    public async Task<PagedResult<DoctorListItemDto>> SearchAsync(DoctorQuery q, CancellationToken ct)
    {
        var page = Math.Max(1, q.Page);
        var size = Math.Clamp(q.PageSize, 1, 50);

        var query = db.Doctors
            .Include(d => d.User)
            .Include(d => d.Department)
            .Where(d => d.User.IsActive);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim();
            query = query.Where(d =>
                d.User.FullName.Contains(term) ||
                d.Specialization.Contains(term) ||
                d.Department.Name.Contains(term));
        }

        if (q.DepartmentId is { } deptId)
            query = query.Where(d => d.DepartmentId == deptId);

        if (!string.IsNullOrWhiteSpace(q.Specialization))
            query = query.Where(d => d.Specialization == q.Specialization);

        if (q.MinRating is { } minRating)
            query = query.Where(d => d.RatingAvg >= minRating);

        query = query.OrderByDescending(d => d.RatingAvg).ThenBy(d => d.User.FullName);

        var candidates = await query
            .Select(d => new DoctorListItemDto(
                d.Id,
                d.User.FullName,
                d.Specialization,
                d.DepartmentId,
                d.Department.Name,
                d.ExperienceYears,
                d.ConsultationFee,
                new FeeSchedule(d.ConsultationFee, d.FollowUpFee, d.ProcedureFee, d.SurgeryFee),
                d.RatingAvg,
                d.RatingCount,
                d.Bio))
            .ToListAsync(ct);

        // "Available on" needs slot computation, so it is applied in memory.
        if (q.AvailableOn is { } date)
        {
            var filtered = new List<DoctorListItemDto>();
            foreach (var doc in candidates)
            {
                var open = await slots.GetOpenSlotsAsync(doc.Id, date, date, ct);
                if (open.Count > 0)
                    filtered.Add(doc);
            }
            candidates = filtered;
        }

        var total = candidates.Count;
        var items = candidates.Skip((page - 1) * size).Take(size).ToList();

        return new PagedResult<DoctorListItemDto>(items, page, size, total);
    }

    public async Task<DoctorDetailDto> GetAsync(int id, CancellationToken ct)
    {
        var doctor = await db.Doctors
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.Availabilities)
            .FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new KeyNotFoundException("Doctor not found.");

        var windows = doctor.Availabilities
            .Where(a => a.IsActive)
            .OrderBy(a => a.DayOfWeek).ThenBy(a => a.StartTime)
            .Select(a => new AvailabilityWindowDto(
                (int)a.DayOfWeek,
                a.StartTime.ToString("HH:mm"),
                a.EndTime.ToString("HH:mm"),
                a.SlotDurationMinutes))
            .ToList();

        return new DoctorDetailDto(
            doctor.Id,
            doctor.User.FullName,
            doctor.User.Email,
            doctor.User.Phone,
            doctor.Specialization,
            doctor.Qualifications,
            doctor.DepartmentId,
            doctor.Department.Name,
            doctor.ExperienceYears,
            doctor.ConsultationFee,
            new FeeSchedule(doctor.ConsultationFee, doctor.FollowUpFee, doctor.ProcedureFee, doctor.SurgeryFee),
            doctor.RatingAvg,
            doctor.RatingCount,
            doctor.Bio,
            windows);
    }

    public async Task<IReadOnlyList<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct) =>
        await db.Departments
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Description))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<string>> GetSpecializationsAsync(CancellationToken ct) =>
        await db.Doctors
            .Select(d => d.Specialization)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(ct);
}
