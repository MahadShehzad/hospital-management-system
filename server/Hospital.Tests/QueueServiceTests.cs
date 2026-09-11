using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Hospital.Tests;

public class QueueServiceTests
{
    private sealed class FakeUser(int id, UserRole role) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public int UserId { get; } = id;
        public UserRole Role { get; } = role;
        public string Email => "t@t.local";
    }

    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"queue-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options);

    private static async Task<(int DoctorId, int P1, int P2)> SeedAsync(AppDbContext db)
    {
        var dept = new Department { Name = "General" };
        db.Departments.Add(dept);
        var du = new User { FullName = "Doc", Email = "d@t.l", Role = UserRole.Doctor, PasswordHash = "x" };
        var u1 = new User { FullName = "P1", Email = "p1@t.l", Role = UserRole.Patient, PasswordHash = "x", Phone = "1" };
        var u2 = new User { FullName = "P2", Email = "p2@t.l", Role = UserRole.Patient, PasswordHash = "x", Phone = "2" };
        db.Users.AddRange(du, u1, u2);
        await db.SaveChangesAsync();
        var doctor = new Doctor { UserId = du.Id, DepartmentId = dept.Id, Specialization = "GP" };
        db.Doctors.Add(doctor);
        var p1 = new Patient { UserId = u1.Id };
        var p2 = new Patient { UserId = u2.Id };
        db.Patients.AddRange(p1, p2);
        await db.SaveChangesAsync();
        return (doctor.Id, p1.Id, p2.Id);
    }

    [Fact]
    public async Task Calling_a_second_patient_sends_the_first_back_to_waiting()
    {
        await using var db = NewDb();
        var (doctorId, p1, p2) = await SeedAsync(db);
        var reception = new QueueService(db, new FakeUser(999, UserRole.Receptionist));

        var t1 = await reception.AddAsync(new AddToQueueRequest { DoctorId = doctorId, PatientId = p1 }, default);
        var t2 = await reception.AddAsync(new AddToQueueRequest { DoctorId = doctorId, PatientId = p2 }, default);

        await reception.UpdateStatusAsync(t1.Id, QueueStatus.Called, default);
        await reception.UpdateStatusAsync(t2.Id, QueueStatus.Called, default);

        var list = await reception.GetTodayAsync(doctorId, default);
        Assert.Equal(QueueStatus.Waiting, list.Single(e => e.Id == t1.Id).Status);
        Assert.Equal(QueueStatus.Called, list.Single(e => e.Id == t2.Id).Status);
    }

    [Fact]
    public async Task Call_next_serves_the_lowest_waiting_token()
    {
        await using var db = NewDb();
        var (doctorId, p1, p2) = await SeedAsync(db);
        var svc = new QueueService(db, new FakeUser(999, UserRole.Receptionist));

        var t1 = await svc.AddAsync(new AddToQueueRequest { DoctorId = doctorId, PatientId = p1 }, default);
        await svc.AddAsync(new AddToQueueRequest { DoctorId = doctorId, PatientId = p2 }, default);

        var next = await svc.CallNextAsync(doctorId, default);
        Assert.Equal(t1.TokenNumber, next!.TokenNumber);
        Assert.Equal(QueueStatus.Called, next.Status);
    }
}
