using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Hospital.Tests;

public class BookingConflictTests
{
    private sealed class FakeCurrentUser(int userId, UserRole role) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public int UserId { get; } = userId;
        public UserRole Role { get; } = role;
        public string Email => "test@test.local";
    }

    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"booking-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options);

    private static async Task<(int DoctorId, int Patient1UserId, int Patient2UserId, DateTime SlotStart)> SeedAsync(AppDbContext db)
    {
        var dept = new Department { Name = "General Medicine" };
        db.Departments.Add(dept);

        var docUser = new User { FullName = "Dr Test", Email = "dr@test.local", Role = UserRole.Doctor, PasswordHash = "x" };
        var p1User = new User { FullName = "Pat One", Email = "p1@test.local", Role = UserRole.Patient, PasswordHash = "x" };
        var p2User = new User { FullName = "Pat Two", Email = "p2@test.local", Role = UserRole.Patient, PasswordHash = "x" };
        db.Users.AddRange(docUser, p1User, p2User);
        await db.SaveChangesAsync();

        var doctor = new Doctor { UserId = docUser.Id, DepartmentId = dept.Id, Specialization = "GP", ConsultationFee = 1000 };
        db.Doctors.Add(doctor);
        db.Patients.AddRange(
            new Patient { UserId = p1User.Id },
            new Patient { UserId = p2User.Id });
        await db.SaveChangesAsync();

        // A weekday roughly a week out, at 10:00, so it always clears the 1h lead.
        var date = DateOnly.FromDateTime(DateTime.Now.Date.AddDays(8));
        db.DoctorAvailabilities.Add(new DoctorAvailability
        {
            DoctorId = doctor.Id,
            DayOfWeek = date.DayOfWeek,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(13, 0),
            SlotDurationMinutes = 30,
        });
        await db.SaveChangesAsync();

        return (doctor.Id, p1User.Id, p2User.Id, date.ToDateTime(new TimeOnly(10, 0)));
    }

    private static AppointmentService ServiceFor(AppDbContext db, int userId, UserRole role = UserRole.Patient)
    {
        var current = new FakeCurrentUser(userId, role);
        return new AppointmentService(db, new SlotService(db), current);
    }

    [Fact]
    public async Task Second_booking_of_the_same_slot_is_rejected()
    {
        await using var db = NewDb();
        var (doctorId, p1, p2, slotStart) = await SeedAsync(db);

        var first = await ServiceFor(db, p1).BookAsync(
            new BookAppointmentRequest { DoctorId = doctorId, Start = slotStart, Reason = "Checkup" },
            CancellationToken.None);
        Assert.Equal(AppointmentStatus.Pending, first.Status);

        await Assert.ThrowsAsync<SlotUnavailableException>(() =>
            ServiceFor(db, p2).BookAsync(
                new BookAppointmentRequest { DoctorId = doctorId, Start = slotStart, Reason = "Also checkup" },
                CancellationToken.None));

        Assert.Equal(1, await db.Appointments.CountAsync());
    }

    [Fact]
    public async Task Booking_a_time_outside_availability_is_rejected()
    {
        await using var db = NewDb();
        var (doctorId, p1, _, slotStart) = await SeedAsync(db);

        await Assert.ThrowsAsync<SlotUnavailableException>(() =>
            ServiceFor(db, p1).BookAsync(
                new BookAppointmentRequest { DoctorId = doctorId, Start = slotStart.Date.AddHours(22), Reason = "Midnight" },
                CancellationToken.None));
    }

    [Fact]
    public async Task Cancelling_frees_the_slot_for_another_patient()
    {
        await using var db = NewDb();
        var (doctorId, p1, p2, slotStart) = await SeedAsync(db);

        var first = await ServiceFor(db, p1).BookAsync(
            new BookAppointmentRequest { DoctorId = doctorId, Start = slotStart, Reason = "Checkup" },
            CancellationToken.None);

        await ServiceFor(db, p1).CancelAsync(first.Id,
            new CancelAppointmentRequest { Reason = "Changed plans" }, CancellationToken.None);

        var second = await ServiceFor(db, p2).BookAsync(
            new BookAppointmentRequest { DoctorId = doctorId, Start = slotStart, Reason = "Now free" },
            CancellationToken.None);

        Assert.Equal(AppointmentStatus.Pending, second.Status);
    }
}
