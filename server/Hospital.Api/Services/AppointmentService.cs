using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Domain.Scheduling;
using Hospital.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class AppointmentService(AppDbContext db, SlotService slots, ICurrentUser currentUser)
{
    private const int UniqueViolation = 2627;
    private const int DuplicateKey = 2601;

    public async Task<AppointmentDto> BookAsync(BookAppointmentRequest request, CancellationToken ct)
    {
        var patient = await RequireCurrentPatientAsync(ct);
        return await BookInternalAsync(patient.Id, request, "Booked by patient", ct);
    }

    /// <summary>Staff booking on behalf of a patient (receptionist / admin).</summary>
    public async Task<AppointmentDto> BookForAsync(int patientId, BookAppointmentRequest request, CancellationToken ct)
    {
        if (!await db.Patients.AnyAsync(p => p.Id == patientId, ct))
            throw new KeyNotFoundException("Patient not found.");
        return await BookInternalAsync(patientId, request, $"Booked by {currentUser.Role}", ct);
    }

    private async Task<AppointmentDto> BookInternalAsync(
        int patientId, BookAppointmentRequest request, string note, CancellationToken ct)
    {
        var slot = await slots.ResolveSlotAsync(request.DoctorId, request.Start, ct)
                   ?? throw new SlotUnavailableException("That time slot is no longer available.");

        var appointment = new Appointment
        {
            PatientId = patientId,
            DoctorId = request.DoctorId,
            ScheduledStart = slot.Start,
            ScheduledEnd = slot.End,
            Status = AppointmentStatus.Pending,
            Reason = request.Reason.Trim(),
        };
        appointment.StatusHistory.Add(new AppointmentStatusHistory
        {
            FromStatus = null,
            ToStatus = AppointmentStatus.Pending,
            ChangedByUserId = currentUser.UserId,
            Note = note,
        });

        await InSerializableTransactionAsync(async () =>
        {
            await GuardNoClashAsync(request.DoctorId, slot, excludeAppointmentId: null, ct);
            db.Appointments.Add(appointment);
            await db.SaveChangesAsync(ct);
        }, ct);

        return await ProjectAsync(appointment.Id, ct);
    }

    public async Task<IReadOnlyList<AppointmentDto>> GetMineAsync(CancellationToken ct)
    {
        var query = BaseQuery();

        query = currentUser.Role switch
        {
            UserRole.Patient => query.Where(a => a.Patient.UserId == currentUser.UserId),
            UserRole.Doctor => query.Where(a => a.Doctor.UserId == currentUser.UserId),
            _ => query, // reception / admin see all
        };

        return await query
            .OrderByDescending(a => a.ScheduledStart)
            .Select(Projection)
            .ToListAsync(ct);
    }

    public async Task<AppointmentDto> GetAsync(int id, CancellationToken ct)
    {
        await LoadOwnedAsync(id, ct); // authorises for the current user
        return await ProjectAsync(id, ct);
    }

    public async Task<AppointmentDto> RescheduleAsync(int id, RescheduleAppointmentRequest request, CancellationToken ct)
    {
        var appointment = await LoadOwnedAsync(id, ct);

        if (appointment.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            throw new BusinessRuleException($"A {appointment.Status} appointment cannot be rescheduled.");

        var slot = await slots.ResolveSlotAsync(appointment.DoctorId, request.Start, ct)
                   ?? throw new SlotUnavailableException("That time slot is not available.");

        await InSerializableTransactionAsync(async () =>
        {
            await GuardNoClashAsync(appointment.DoctorId, slot, appointment.Id, ct);

            appointment.ScheduledStart = slot.Start;
            appointment.ScheduledEnd = slot.End;
            appointment.UpdatedAt = DateTime.UtcNow;
            appointment.StatusHistory.Add(new AppointmentStatusHistory
            {
                FromStatus = appointment.Status,
                ToStatus = appointment.Status,
                ChangedByUserId = currentUser.UserId,
                Note = $"Rescheduled to {slot.Start:g}",
            });

            await db.SaveChangesAsync(ct);
        }, ct);

        return await ProjectAsync(appointment.Id, ct);
    }

    public async Task<AppointmentDto> CancelAsync(int id, CancelAppointmentRequest request, CancellationToken ct)
    {
        var appointment = await LoadOwnedAsync(id, ct);
        Transition(appointment, AppointmentStatus.Cancelled, request.Reason);
        appointment.CancelledReason = request.Reason;
        await db.SaveChangesAsync(ct);
        return await ProjectAsync(appointment.Id, ct);
    }

    public async Task<AppointmentDto> ChangeStatusAsync(int id, ChangeStatusRequest request, CancellationToken ct)
    {
        var appointment = await LoadOwnedAsync(id, ct);
        Transition(appointment, request.Status, request.Note);
        if (request.Status == AppointmentStatus.Cancelled)
            appointment.CancelledReason = request.Note;
        await db.SaveChangesAsync(ct);
        return await ProjectAsync(appointment.Id, ct);
    }

    private void Transition(Appointment appointment, AppointmentStatus to, string? note)
    {
        AppointmentStateMachine.EnsureCanTransition(appointment.Status, to);

        appointment.StatusHistory.Add(new AppointmentStatusHistory
        {
            FromStatus = appointment.Status,
            ToStatus = to,
            ChangedByUserId = currentUser.UserId,
            Note = note,
        });
        appointment.Status = to;
        appointment.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Runs <paramref name="work"/> inside a serializable transaction as a single retriable
    /// unit (required because the SQL Server provider uses a retrying execution strategy).
    /// Translates a unique-index violation from the double-booking guard into a friendly error.
    /// </summary>
    private async Task InSerializableTransactionAsync(Func<Task> work, CancellationToken ct)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct);
                await work();
                await tx.CommitAsync(ct);
            });
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            throw new SlotUnavailableException("That time slot was just taken.");
        }
    }

    private async Task GuardNoClashAsync(int doctorId, SlotDto slot, int? excludeAppointmentId, CancellationToken ct)
    {
        var clash = await db.Appointments.AnyAsync(a =>
            (excludeAppointmentId == null || a.Id != excludeAppointmentId)
            && a.DoctorId == doctorId
            && a.Status != AppointmentStatus.Cancelled
            && a.ScheduledStart < slot.End
            && a.ScheduledEnd > slot.Start, ct);

        if (clash)
            throw new SlotUnavailableException("That time slot was just taken.");
    }

    private async Task<Appointment> LoadOwnedAsync(int id, CancellationToken ct)
    {
        var appointment = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.StatusHistory)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new KeyNotFoundException("Appointment not found.");

        var allowed = currentUser.Role switch
        {
            UserRole.Patient => appointment.Patient.UserId == currentUser.UserId,
            UserRole.Doctor => appointment.Doctor.UserId == currentUser.UserId,
            UserRole.Receptionist or UserRole.Admin => true,
            _ => false,
        };

        if (!allowed)
            throw new ForbiddenException("You cannot modify this appointment.");

        return appointment;
    }

    private async Task<Patient> RequireCurrentPatientAsync(CancellationToken ct) =>
        await db.Patients.FirstOrDefaultAsync(p => p.UserId == currentUser.UserId, ct)
        ?? throw new BusinessRuleException("Only patients can book appointments.");

    private IQueryable<Appointment> BaseQuery() =>
        db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .AsQueryable();

    private async Task<AppointmentDto> ProjectAsync(int id, CancellationToken ct) =>
        await BaseQuery().Where(a => a.Id == id).Select(Projection).FirstAsync(ct);

    private static readonly System.Linq.Expressions.Expression<Func<Appointment, AppointmentDto>> Projection =
        a => new AppointmentDto(
            a.Id,
            a.DoctorId,
            a.Doctor.User.FullName,
            a.Doctor.Specialization,
            a.PatientId,
            a.Patient.User.FullName,
            a.ScheduledStart,
            a.ScheduledEnd,
            a.Status,
            a.Reason,
            a.CancelledReason,
            a.Doctor.ConsultationFee,
            a.CreatedAt);

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sql && sql.Number is UniqueViolation or DuplicateKey;
}
