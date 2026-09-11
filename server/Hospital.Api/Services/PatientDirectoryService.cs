using System.Security.Cryptography;
using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Hospital.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class PatientDirectoryService(AppDbContext db, ICurrentUser currentUser, IPasswordHasher hasher)
{
    public async Task<IReadOnlyList<PatientSummaryDto>> SearchAsync(string? term, CancellationToken ct)
    {
        var query = db.Patients.Include(p => p.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var t = term.Trim();
            query = query.Where(p => p.User.FullName.Contains(t) || p.User.Phone.Contains(t) || p.User.Email.Contains(t));
        }

        var list = await query.OrderBy(p => p.User.FullName).Take(50).ToListAsync(ct);
        return list.Select(p => new PatientSummaryDto(
            p.Id, p.User.FullName, p.User.Phone, Mapping.AgeFrom(p.Dob), p.Gender?.ToString())).ToList();
    }

    public async Task<PatientProfileDto> GetAsync(int patientId, CancellationToken ct)
    {
        var patient = await db.Patients.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == patientId, ct)
            ?? throw new KeyNotFoundException("Patient not found.");

        if (currentUser.Role == UserRole.Patient && patient.UserId != currentUser.UserId)
            throw new ForbiddenException("Not your profile.");

        return ToDto(patient);
    }

    public async Task<PatientProfileDto> GetMineAsync(CancellationToken ct)
    {
        var patient = await db.Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == currentUser.UserId, ct)
            ?? throw new ForbiddenException("No patient profile for this account.");
        return ToDto(patient);
    }

    public async Task<PatientProfileDto> UpdateMineAsync(UpdatePatientProfileRequest request, CancellationToken ct)
    {
        var patient = await db.Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == currentUser.UserId, ct)
            ?? throw new ForbiddenException("No patient profile for this account.");

        patient.Dob = request.Dob;
        patient.Gender = request.Gender;
        patient.BloodGroup = request.BloodGroup?.Trim();
        patient.Address = request.Address?.Trim();
        patient.EmergencyContact = request.EmergencyContact?.Trim();
        await db.SaveChangesAsync(ct);
        return ToDto(patient);
    }

    /// <summary>Receptionist registers a walk-in patient; returns a one-time password.</summary>
    public async Task<(PatientProfileDto Profile, string TemporaryPassword)> RegisterWalkInAsync(
        RegisterWalkInRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new BusinessRuleException("An account with that email already exists.");

        var password = "Hp" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(6))
            .Replace("+", "x").Replace("/", "y").Replace("=", "") + "7!";

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone.Trim(),
            Role = UserRole.Patient,
            PasswordHash = hasher.Hash(password),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var patient = new Patient
        {
            UserId = user.Id,
            Dob = request.Dob,
            Gender = request.Gender,
            BloodGroup = request.BloodGroup?.Trim(),
            Address = request.Address?.Trim(),
            EmergencyContact = request.EmergencyContact?.Trim(),
        };
        db.Patients.Add(patient);
        await db.SaveChangesAsync(ct);

        await db.Entry(patient).Reference(p => p.User).LoadAsync(ct);
        return (ToDto(patient), password);
    }

    private static PatientProfileDto ToDto(Patient p) => new(
        p.Id,
        p.UserId,
        p.User.FullName,
        p.User.Email,
        p.User.Phone,
        p.Dob,
        Mapping.AgeFrom(p.Dob),
        p.Gender?.ToString(),
        p.BloodGroup,
        p.Address,
        p.EmergencyContact);
}
