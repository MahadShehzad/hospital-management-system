using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class PatientReportService(AppDbContext db, ICurrentUser currentUser)
{
    /// <param name="scope">who is asking — results are limited to what they may see</param>
    public async Task<IReadOnlyList<PatientReportDto>> SearchAsync(
        int? patientId, int? doctorId, int? year, DateOnly? from, DateOnly? to, string? search, CancellationToken ct)
    {
        var query = db.PatientReports
            .Include(r => r.Patient).ThenInclude(p => p.User)
            .Include(r => r.Doctor).ThenInclude(d => d.User)
            .AsQueryable();

        // Role scoping
        query = currentUser.Role switch
        {
            UserRole.Patient => query.Where(r => r.Patient.UserId == currentUser.UserId),
            UserRole.Doctor => query.Where(r => r.Doctor.UserId == currentUser.UserId
                                                || r.Patient.Appointments.Any(a => a.Doctor.UserId == currentUser.UserId)),
            _ => query,
        };

        if (patientId is { } pid) query = query.Where(r => r.PatientId == pid);
        if (doctorId is { } did) query = query.Where(r => r.DoctorId == did);
        if (year is { } y) query = query.Where(r => r.ReportDate.Year == y);
        if (from is { } f) query = query.Where(r => r.ReportDate >= f);
        if (to is { } t) query = query.Where(r => r.ReportDate <= t);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(r =>
                r.Title.Contains(s) ||
                r.Doctor.User.FullName.Contains(s) ||
                r.Patient.User.FullName.Contains(s) ||
                r.Doctor.Specialization.Contains(s));
        }

        return await query
            .OrderByDescending(r => r.ReportDate).ThenByDescending(r => r.CreatedAt)
            .Select(Projection)
            .ToListAsync(ct);
    }

    public async Task<PatientReportDto> CreateAsync(SavePatientReportRequest request, CancellationToken ct)
    {
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.UserId == currentUser.UserId, ct)
            ?? throw new ForbiddenException("Only doctors can add reports.");

        if (!await db.Patients.AnyAsync(p => p.Id == request.PatientId, ct))
            throw new KeyNotFoundException("Patient not found.");

        var report = new PatientReport
        {
            PatientId = request.PatientId,
            DoctorId = doctor.Id,
            AppointmentId = request.AppointmentId,
            Title = request.Title.Trim(),
            Type = request.Type,
            ReportDate = request.ReportDate,
            Summary = request.Summary?.Trim(),
            Findings = request.Findings?.Trim(),
        };
        db.PatientReports.Add(report);
        await db.SaveChangesAsync(ct);
        return await LoadAsync(report.Id, ct);
    }

    public async Task<PatientReportDto> UpdateAsync(int id, SavePatientReportRequest request, CancellationToken ct)
    {
        var report = await db.PatientReports.Include(r => r.Doctor)
            .FirstOrDefaultAsync(r => r.Id == id, ct)
            ?? throw new KeyNotFoundException("Report not found.");

        if (currentUser.Role != UserRole.Admin && report.Doctor.UserId != currentUser.UserId)
            throw new ForbiddenException("You can only edit your own reports.");

        report.Title = request.Title.Trim();
        report.Type = request.Type;
        report.ReportDate = request.ReportDate;
        report.Summary = request.Summary?.Trim();
        report.Findings = request.Findings?.Trim();
        report.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await LoadAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var report = await db.PatientReports.Include(r => r.Doctor)
            .FirstOrDefaultAsync(r => r.Id == id, ct)
            ?? throw new KeyNotFoundException("Report not found.");

        if (currentUser.Role != UserRole.Admin && report.Doctor.UserId != currentUser.UserId)
            throw new ForbiddenException("You can only delete your own reports.");

        db.PatientReports.Remove(report);
        await db.SaveChangesAsync(ct);
    }

    private async Task<PatientReportDto> LoadAsync(int id, CancellationToken ct) =>
        await db.PatientReports
            .Include(r => r.Patient).ThenInclude(p => p.User)
            .Include(r => r.Doctor).ThenInclude(d => d.User)
            .Where(r => r.Id == id)
            .Select(Projection)
            .FirstAsync(ct);

    private static readonly System.Linq.Expressions.Expression<Func<PatientReport, PatientReportDto>> Projection =
        r => new PatientReportDto(
            r.Id,
            r.PatientId,
            r.Patient.User.FullName,
            r.DoctorId,
            r.Doctor.User.FullName,
            r.Doctor.Specialization,
            r.AppointmentId,
            r.Title,
            r.Type,
            r.ReportDate,
            r.Summary,
            r.Findings,
            r.CreatedAt);
}
