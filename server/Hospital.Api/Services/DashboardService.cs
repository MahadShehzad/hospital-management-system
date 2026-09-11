using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class DashboardService(AppDbContext db, ICurrentUser currentUser)
{
    public async Task<DoctorDashboardDto> DoctorAsync(CancellationToken ct)
    {
        var doctor = await db.Doctors.Include(d => d.User)
            .FirstOrDefaultAsync(d => d.UserId == currentUser.UserId, ct)
            ?? throw new ForbiddenException("No doctor profile for this account.");

        var today = DateTime.Now.Date;
        var tomorrow = today.AddDays(1);

        var todays = await db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Where(a => a.DoctorId == doctor.Id && a.ScheduledStart >= today && a.ScheduledStart < tomorrow
                        && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.ScheduledStart)
            .Select(Mapping.Appointment)
            .ToListAsync(ct);

        var upcoming = await db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Where(a => a.DoctorId == doctor.Id && a.ScheduledStart >= tomorrow
                        && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed))
            .OrderBy(a => a.ScheduledStart)
            .Take(20)
            .Select(Mapping.Appointment)
            .ToListAsync(ct);

        var todayDate = DateOnly.FromDateTime(DateTime.Now);
        var waiting = await db.QueueEntries.CountAsync(q =>
            q.DoctorId == doctor.Id && q.Date == todayDate
            && (q.Status == QueueStatus.Waiting || q.Status == QueueStatus.Called), ct);

        return new DoctorDashboardDto(
            doctor.User.FullName,
            todays.Count,
            todays.Count(a => a.Status == AppointmentStatus.Completed),
            todays.Count(a => a.Status == AppointmentStatus.Pending),
            upcoming.Count,
            waiting,
            todays,
            upcoming);
    }

    public async Task<ReceptionDashboardDto> ReceptionAsync(CancellationToken ct)
    {
        var today = DateTime.Now.Date;
        var tomorrow = today.AddDays(1);
        var todayDate = DateOnly.FromDateTime(DateTime.Now);

        var schedule = await db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Where(a => a.ScheduledStart >= today && a.ScheduledStart < tomorrow)
            .OrderBy(a => a.ScheduledStart)
            .Select(Mapping.Appointment)
            .ToListAsync(ct);

        var waiting = await db.QueueEntries.CountAsync(q =>
            q.Date == todayDate && (q.Status == QueueStatus.Waiting || q.Status == QueueStatus.Called), ct);

        var unpaid = await db.Invoices.CountAsync(i => i.Status == InvoiceStatus.Unpaid, ct);

        var todayRevenue = await db.Invoices
            .Where(i => i.Status == InvoiceStatus.Paid && i.PaidAt >= today && i.PaidAt < tomorrow)
            .SelectMany(i => i.Items)
            .SumAsync(x => (decimal?)(x.Quantity * x.UnitPrice), ct) ?? 0m;

        return new ReceptionDashboardDto(
            schedule.Count,
            schedule.Count(a => a.Status is AppointmentStatus.Confirmed or AppointmentStatus.Completed),
            waiting,
            unpaid,
            todayRevenue,
            schedule);
    }
}
