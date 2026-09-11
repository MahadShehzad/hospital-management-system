using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

/// <summary>A doctor manages their own recurring availability and per-date time off.</summary>
public sealed class AvailabilityService(AppDbContext db, ICurrentUser currentUser)
{
    private async Task<Doctor> CurrentDoctorAsync(CancellationToken ct) =>
        await db.Doctors.FirstOrDefaultAsync(d => d.UserId == currentUser.UserId, ct)
        ?? throw new ForbiddenException("Only doctors can manage availability.");

    public async Task<IReadOnlyList<AvailabilityDto>> ListAsync(CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var rows = await db.DoctorAvailabilities
            .Where(a => a.DoctorId == doctor.Id)
            .OrderBy(a => a.DayOfWeek).ThenBy(a => a.StartTime)
            .ToListAsync(ct);
        return rows
            .Select(a => new AvailabilityDto(a.Id, (int)a.DayOfWeek, a.StartTime.ToString("HH:mm"), a.EndTime.ToString("HH:mm"), a.SlotDurationMinutes, a.IsActive))
            .ToList();
    }

    public async Task<AvailabilityDto> AddAsync(SaveAvailabilityRequest request, CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var day = (DayOfWeek)request.DayOfWeek;
        if (request.EndTime <= request.StartTime)
            throw new BusinessRuleException("End time must be after start time.");

        var overlaps = await db.DoctorAvailabilities.AnyAsync(a =>
            a.DoctorId == doctor.Id && a.DayOfWeek == day
            && a.StartTime < request.EndTime && request.StartTime < a.EndTime, ct);
        if (overlaps)
            throw new BusinessRuleException("This window overlaps an existing one for that day.");

        var entity = new DoctorAvailability
        {
            DoctorId = doctor.Id,
            DayOfWeek = day,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotDurationMinutes = request.SlotDurationMinutes,
            IsActive = request.IsActive,
        };
        db.DoctorAvailabilities.Add(entity);
        await db.SaveChangesAsync(ct);
        return new AvailabilityDto(entity.Id, (int)entity.DayOfWeek, entity.StartTime.ToString("HH:mm"), entity.EndTime.ToString("HH:mm"), entity.SlotDurationMinutes, entity.IsActive);
    }

    public async Task<AvailabilityDto> UpdateAsync(int id, SaveAvailabilityRequest request, CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var entity = await db.DoctorAvailabilities.FirstOrDefaultAsync(a => a.Id == id && a.DoctorId == doctor.Id, ct)
            ?? throw new KeyNotFoundException("Availability window not found.");
        if (request.EndTime <= request.StartTime)
            throw new BusinessRuleException("End time must be after start time.");

        entity.DayOfWeek = (DayOfWeek)request.DayOfWeek;
        entity.StartTime = request.StartTime;
        entity.EndTime = request.EndTime;
        entity.SlotDurationMinutes = request.SlotDurationMinutes;
        entity.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return new AvailabilityDto(entity.Id, (int)entity.DayOfWeek, entity.StartTime.ToString("HH:mm"), entity.EndTime.ToString("HH:mm"), entity.SlotDurationMinutes, entity.IsActive);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var entity = await db.DoctorAvailabilities.FirstOrDefaultAsync(a => a.Id == id && a.DoctorId == doctor.Id, ct)
            ?? throw new KeyNotFoundException("Availability window not found.");
        db.DoctorAvailabilities.Remove(entity);
        await db.SaveChangesAsync(ct);
    }

    // ---- Time off ----

    public async Task<IReadOnlyList<TimeOffDto>> ListTimeOffAsync(CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.Now);
        return await db.DoctorAvailabilityExceptions
            .Where(x => x.DoctorId == doctor.Id && x.Date >= today.AddDays(-1))
            .OrderBy(x => x.Date)
            .Select(x => new TimeOffDto(x.Id, x.Date, x.IsOff, x.StartTime, x.EndTime))
            .ToListAsync(ct);
    }

    public async Task<TimeOffDto> SaveTimeOffAsync(SaveTimeOffRequest request, CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var entity = await db.DoctorAvailabilityExceptions
            .FirstOrDefaultAsync(x => x.DoctorId == doctor.Id && x.Date == request.Date, ct);

        if (entity is null)
        {
            entity = new DoctorAvailabilityException { DoctorId = doctor.Id, Date = request.Date };
            db.DoctorAvailabilityExceptions.Add(entity);
        }
        entity.IsOff = request.IsOff;
        entity.StartTime = request.IsOff ? null : request.StartTime;
        entity.EndTime = request.IsOff ? null : request.EndTime;
        await db.SaveChangesAsync(ct);
        return new TimeOffDto(entity.Id, entity.Date, entity.IsOff, entity.StartTime, entity.EndTime);
    }

    public async Task DeleteTimeOffAsync(int id, CancellationToken ct)
    {
        var doctor = await CurrentDoctorAsync(ct);
        var entity = await db.DoctorAvailabilityExceptions.FirstOrDefaultAsync(x => x.Id == id && x.DoctorId == doctor.Id, ct)
            ?? throw new KeyNotFoundException("Entry not found.");
        db.DoctorAvailabilityExceptions.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}
