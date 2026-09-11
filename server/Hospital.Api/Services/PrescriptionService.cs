using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class PrescriptionService(AppDbContext db, ICurrentUser currentUser)
{
    public async Task<PrescriptionDto?> GetByAppointmentAsync(int appointmentId, CancellationToken ct)
    {
        var appointment = await LoadVisibleAppointmentAsync(appointmentId, ct);

        var prescription = await db.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.AppointmentId == appointmentId, ct);

        return prescription is null ? null : await ProjectAsync(prescription, appointment, ct);
    }

    public async Task<IReadOnlyList<PrescriptionDto>> GetMineAsync(CancellationToken ct)
    {
        var query = db.Prescriptions
            .Include(p => p.Items)
            .Include(p => p.Appointment).ThenInclude(a => a.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Appointment).ThenInclude(a => a.Patient).ThenInclude(pt => pt.User)
            .AsQueryable();

        query = currentUser.Role switch
        {
            UserRole.Patient => query.Where(p => p.Appointment.Patient.UserId == currentUser.UserId),
            UserRole.Doctor => query.Where(p => p.Appointment.Doctor.UserId == currentUser.UserId),
            _ => query,
        };

        var list = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        var settings = await db.ClinicSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        return list.Select(p => Project(p, p.Appointment, settings)).ToList();
    }

    public async Task<PrescriptionDto> SaveAsync(int appointmentId, SavePrescriptionRequest request, CancellationToken ct)
    {
        var appointment = await LoadVisibleAppointmentAsync(appointmentId, ct);

        if (appointment.Doctor.UserId != currentUser.UserId)
            throw new ForbiddenException("Only the treating doctor can write this prescription.");

        if (request.Items.Count == 0)
            throw new BusinessRuleException("Add at least one medicine.");

        var prescription = await db.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.AppointmentId == appointmentId, ct);

        if (prescription is null)
        {
            prescription = new Prescription { AppointmentId = appointmentId };
            db.Prescriptions.Add(prescription);
        }
        else
        {
            db.PrescriptionItems.RemoveRange(prescription.Items);
        }

        prescription.Diagnosis = request.Diagnosis?.Trim();
        prescription.Notes = request.Notes?.Trim();
        prescription.FollowUpDate = request.FollowUpDate;
        prescription.UpdatedAt = DateTime.UtcNow;
        prescription.Items = request.Items.Select(i => new PrescriptionItem
        {
            MedicineName = i.MedicineName.Trim(),
            Dosage = i.Dosage?.Trim(),
            Frequency = i.Frequency?.Trim(),
            DurationDays = i.DurationDays,
            Instructions = i.Instructions?.Trim(),
        }).ToList();

        await db.SaveChangesAsync(ct);
        return await ProjectAsync(prescription, appointment, ct);
    }

    private async Task<Appointment> LoadVisibleAppointmentAsync(int appointmentId, CancellationToken ct)
    {
        var appointment = await db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == appointmentId, ct)
            ?? throw new KeyNotFoundException("Appointment not found.");

        var allowed = currentUser.Role switch
        {
            UserRole.Patient => appointment.Patient.UserId == currentUser.UserId,
            UserRole.Doctor => appointment.Doctor.UserId == currentUser.UserId,
            UserRole.Receptionist or UserRole.Admin => true,
            _ => false,
        };
        if (!allowed)
            throw new ForbiddenException("You cannot access this prescription.");

        return appointment;
    }

    private async Task<PrescriptionDto> ProjectAsync(Prescription p, Appointment appointment, CancellationToken ct)
    {
        var settings = await db.ClinicSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        return Project(p, appointment, settings);
    }

    private static PrescriptionDto Project(Prescription p, Appointment appointment, ClinicSetting? settings) => new(
        p.Id,
        p.AppointmentId,
        appointment.Doctor.User.FullName,
        appointment.Doctor.Specialization,
        appointment.Patient.User.FullName,
        Mapping.AgeFrom(appointment.Patient.Dob),
        appointment.Patient.Gender?.ToString(),
        appointment.ScheduledStart,
        p.Diagnosis,
        p.Notes,
        p.FollowUpDate,
        p.CreatedAt,
        p.Items.Select(i => new PrescriptionItemDto
        {
            MedicineName = i.MedicineName,
            Dosage = i.Dosage,
            Frequency = i.Frequency,
            DurationDays = i.DurationDays,
            Instructions = i.Instructions,
        }).ToList(),
        settings?.ClinicName ?? "MediCare Clinic",
        settings?.Address,
        settings?.Phone);
}
