using Hospital.Api.Contracts;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class ReportService(AppDbContext db)
{
    public async Task<AdminReportDto> BuildAsync(CancellationToken ct)
    {
        var now = DateTime.Now;
        var today = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var trendStart = today.AddDays(-13);

        var totalPatients = await db.Patients.CountAsync(ct);
        var totalDoctors = await db.Doctors.CountAsync(ct);
        var totalStaff = await db.Users.CountAsync(u => u.Role == UserRole.Receptionist || u.Role == UserRole.Admin, ct);

        var appointmentsThisMonth = await db.Appointments.CountAsync(a => a.ScheduledStart >= monthStart, ct);
        var appointmentsToday = await db.Appointments.CountAsync(a => a.ScheduledStart >= today && a.ScheduledStart < today.AddDays(1), ct);

        var paid = db.Invoices.Where(i => i.Status == InvoiceStatus.Paid);
        var revenueThisMonth = await paid.Where(i => i.PaidAt >= monthStart)
            .SelectMany(i => i.Items).SumAsync(x => (decimal?)(x.Quantity * x.UnitPrice), ct) ?? 0m;
        var revenueToday = await paid.Where(i => i.PaidAt >= today && i.PaidAt < today.AddDays(1))
            .SelectMany(i => i.Items).SumAsync(x => (decimal?)(x.Quantity * x.UnitPrice), ct) ?? 0m;
        var unpaid = await db.Invoices.CountAsync(i => i.Status == InvoiceStatus.Unpaid, ct);

        var byStatus = await db.Appointments
            .GroupBy(a => a.Status)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var trendRaw = await db.Appointments
            .Where(a => a.ScheduledStart >= trendStart && a.ScheduledStart < today.AddDays(1))
            .GroupBy(a => a.ScheduledStart.Date)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var trend = Enumerable.Range(0, 14)
            .Select(i => DateOnly.FromDateTime(trendStart.AddDays(i)))
            .Select(d => new DailyCountDto(d,
                trendRaw.FirstOrDefault(x => DateOnly.FromDateTime(x.Key) == d)?.Count ?? 0))
            .ToList();

        var byDept = await db.Appointments
            .GroupBy(a => a.Doctor.Department.Name)
            .Select(g => new DepartmentCountDto(g.Key, g.Select(a => a.PatientId).Distinct().Count()))
            .ToListAsync(ct);

        var doctors = await db.Doctors
            .Select(d => new { d.Id, Name = d.User.FullName, d.Specialization, d.RatingAvg })
            .ToListAsync(ct);

        var apptStats = await db.Appointments
            .GroupBy(a => a.DoctorId)
            .Select(g => new
            {
                DoctorId = g.Key,
                Total = g.Count(),
                Completed = g.Count(a => a.Status == AppointmentStatus.Completed),
                NoShow = g.Count(a => a.Status == AppointmentStatus.NoShow),
                Cancelled = g.Count(a => a.Status == AppointmentStatus.Cancelled),
            })
            .ToListAsync(ct);

        var revenueByDoctor = await db.Invoices
            .Where(i => i.Status == InvoiceStatus.Paid && i.AppointmentId != null)
            .SelectMany(i => i.Items.Select(x => new { i.Appointment!.DoctorId, Amount = x.Quantity * x.UnitPrice }))
            .GroupBy(x => x.DoctorId)
            .Select(g => new { DoctorId = g.Key, Revenue = g.Sum(x => x.Amount) })
            .ToListAsync(ct);

        var performance = doctors
            .Select(d =>
            {
                var s = apptStats.FirstOrDefault(x => x.DoctorId == d.Id);
                var rev = revenueByDoctor.FirstOrDefault(x => x.DoctorId == d.Id)?.Revenue ?? 0m;
                return new DoctorPerformanceDto(
                    d.Id, d.Name, d.Specialization,
                    s?.Total ?? 0, s?.Completed ?? 0, s?.NoShow ?? 0, s?.Cancelled ?? 0,
                    d.RatingAvg, rev);
            })
            .OrderByDescending(p => p.TotalAppointments)
            .ToList();

        return new AdminReportDto(
            totalPatients, totalDoctors, totalStaff,
            appointmentsThisMonth, appointmentsToday,
            revenueThisMonth, revenueToday, unpaid,
            byStatus.Select(x => new StatusCountDto(x.Key.ToString(), x.Count)).ToList(),
            performance,
            trend,
            byDept.OrderByDescending(x => x.Count).ToList());
    }
}
