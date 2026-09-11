using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class QueueService(AppDbContext db, ICurrentUser currentUser)
{
    public async Task<IReadOnlyList<QueueEntryDto>> GetTodayAsync(int? doctorId, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var query = BaseQuery().Where(q => q.Date == today);

        if (currentUser.Role == UserRole.Doctor)
            query = query.Where(q => q.Doctor.UserId == currentUser.UserId);
        else if (doctorId is { } id)
            query = query.Where(q => q.DoctorId == id);

        return await query
            .OrderBy(q => q.TokenNumber)
            .Select(Projection)
            .ToListAsync(ct);
    }

    public async Task<QueueEntryDto> AddAsync(AddToQueueRequest request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);

        if (!await db.Doctors.AnyAsync(d => d.Id == request.DoctorId, ct))
            throw new KeyNotFoundException("Doctor not found.");
        if (!await db.Patients.AnyAsync(p => p.Id == request.PatientId, ct))
            throw new KeyNotFoundException("Patient not found.");

        var already = await db.QueueEntries.AnyAsync(q =>
            q.Date == today && q.DoctorId == request.DoctorId && q.PatientId == request.PatientId
            && q.Status != QueueStatus.Done && q.Status != QueueStatus.Skipped, ct);
        if (already)
            throw new BusinessRuleException("That patient is already in this doctor's queue today.");

        var lastToken = await db.QueueEntries
            .Where(q => q.Date == today && q.DoctorId == request.DoctorId)
            .MaxAsync(q => (int?)q.TokenNumber, ct) ?? 0;

        var entry = new QueueEntry
        {
            DoctorId = request.DoctorId,
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            Date = today,
            TokenNumber = lastToken + 1,
            Status = QueueStatus.Waiting,
            Notes = request.Notes?.Trim(),
        };
        db.QueueEntries.Add(entry);
        await db.SaveChangesAsync(ct);

        return await BaseQuery().Where(q => q.Id == entry.Id).Select(Projection).FirstAsync(ct);
    }

    public async Task<QueueEntryDto> UpdateStatusAsync(int id, QueueStatus status, CancellationToken ct)
    {
        var entry = await db.QueueEntries.Include(q => q.Doctor)
            .FirstOrDefaultAsync(q => q.Id == id, ct)
            ?? throw new KeyNotFoundException("Queue entry not found.");

        if (currentUser.Role == UserRole.Doctor && entry.Doctor.UserId != currentUser.UserId)
            throw new ForbiddenException("Not your queue.");

        // Calling a specific patient: make sure no one else is left "Called" for this
        // doctor today — send any other still-Called token back to Waiting (never
        // auto-advance or auto-complete another patient).
        if (status == QueueStatus.Called)
        {
            var others = await db.QueueEntries
                .Where(q => q.Id != entry.Id && q.DoctorId == entry.DoctorId && q.Date == entry.Date
                            && q.Status == QueueStatus.Called)
                .ToListAsync(ct);
            foreach (var o in others)
                o.Status = QueueStatus.Waiting;
        }

        if (status is QueueStatus.Called or QueueStatus.InRoom && entry.CalledAt is null)
            entry.CalledAt = DateTime.UtcNow;
        entry.Status = status;

        await db.SaveChangesAsync(ct);
        return await BaseQuery().Where(q => q.Id == id).Select(Projection).FirstAsync(ct);
    }

    /// <summary>Marks the current in-room/called entry done and calls the next waiting token.</summary>
    public async Task<QueueEntryDto?> CallNextAsync(int doctorId, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);

        var active = await db.QueueEntries
            .Where(q => q.Date == today && q.DoctorId == doctorId
                        && (q.Status == QueueStatus.Called || q.Status == QueueStatus.InRoom))
            .ToListAsync(ct);
        foreach (var a in active) a.Status = QueueStatus.Done;

        var next = await db.QueueEntries
            .Where(q => q.Date == today && q.DoctorId == doctorId && q.Status == QueueStatus.Waiting)
            .OrderBy(q => q.TokenNumber)
            .FirstOrDefaultAsync(ct);

        if (next is not null)
        {
            next.Status = QueueStatus.Called;
            next.CalledAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        return next is null
            ? null
            : await BaseQuery().Where(q => q.Id == next.Id).Select(Projection).FirstAsync(ct);
    }

    private IQueryable<QueueEntry> BaseQuery() =>
        db.QueueEntries
            .Include(q => q.Doctor).ThenInclude(d => d.User)
            .Include(q => q.Patient).ThenInclude(p => p.User);

    private static readonly System.Linq.Expressions.Expression<Func<QueueEntry, QueueEntryDto>> Projection =
        q => new QueueEntryDto(
            q.Id,
            q.DoctorId,
            q.Doctor.User.FullName,
            q.PatientId,
            q.Patient.User.FullName,
            q.Patient.User.Phone,
            q.TokenNumber,
            q.Status,
            q.Date,
            q.CreatedAt,
            q.CalledAt,
            q.Notes);
}
