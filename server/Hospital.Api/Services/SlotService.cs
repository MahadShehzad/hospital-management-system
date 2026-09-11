using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Scheduling;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class SlotService(AppDbContext db)
{
    /// <summary>Minimum notice before a slot may be booked.</summary>
    public static readonly TimeSpan MinLead = TimeSpan.FromHours(1);

    public async Task<IReadOnlyList<SlotDto>> GetOpenSlotsAsync(
        int doctorId, DateOnly from, DateOnly to, CancellationToken ct)
    {
        var doctorExists = await db.Doctors.AnyAsync(d => d.Id == doctorId, ct);
        if (!doctorExists)
            throw new KeyNotFoundException("Doctor not found.");

        var settings = await db.ClinicSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        var lead = TimeSpan.FromHours(settings?.BookingLeadHours ?? 1);

        var availabilities = await db.DoctorAvailabilities
            .Where(a => a.DoctorId == doctorId)
            .ToListAsync(ct);

        var exceptions = await db.DoctorAvailabilityExceptions
            .Where(x => x.DoctorId == doctorId && x.Date >= from && x.Date <= to)
            .ToListAsync(ct);

        // Clinic-wide holidays act as a day off for every doctor.
        var holidays = await db.Holidays
            .Where(h => h.Date >= from && h.Date <= to)
            .Select(h => h.Date)
            .ToListAsync(ct);
        exceptions.AddRange(holidays.Select(d => new DoctorAvailabilityException
        {
            DoctorId = doctorId,
            Date = d,
            IsOff = true,
        }));

        var rangeStart = from.ToDateTime(TimeOnly.MinValue);
        var rangeEnd = to.AddDays(1).ToDateTime(TimeOnly.MinValue);

        var booked = await db.Appointments
            .Where(a => a.DoctorId == doctorId
                        && a.Status != AppointmentStatus.Cancelled
                        && a.ScheduledStart < rangeEnd
                        && a.ScheduledEnd > rangeStart)
            .Select(a => new { a.ScheduledStart, a.ScheduledEnd })
            .ToListAsync(ct);

        var slots = SlotCalculator.Generate(
            availabilities,
            exceptions,
            booked.Select(b => (b.ScheduledStart, b.ScheduledEnd)),
            from,
            to,
            DateTime.Now,
            lead);

        return slots.Select(s => new SlotDto(s.Start, s.End)).ToList();
    }

    /// <summary>
    /// True when <paramref name="start"/> is a currently-open slot for the doctor
    /// (correct grid position, within a working window, not booked, enough lead time).
    /// </summary>
    public async Task<SlotDto?> ResolveSlotAsync(int doctorId, DateTime start, CancellationToken ct)
    {
        var date = DateOnly.FromDateTime(start);
        var open = await GetOpenSlotsAsync(doctorId, date, date, ct);
        return open.FirstOrDefault(s => s.Start == start);
    }
}
