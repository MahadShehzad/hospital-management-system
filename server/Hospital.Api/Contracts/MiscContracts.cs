using System.ComponentModel.DataAnnotations;

namespace Hospital.Api.Contracts;

// ---- Clinic settings ----
public sealed record ClinicSettingsDto
{
    [Required, StringLength(150)] public string ClinicName { get; init; } = string.Empty;
    [StringLength(300)] public string? Address { get; init; }
    [StringLength(30)] public string? Phone { get; init; }
    [StringLength(200)] public string? Email { get; init; }
    public TimeOnly OpenTime { get; init; }
    public TimeOnly CloseTime { get; init; }
    [Range(0, 168)] public int BookingLeadHours { get; init; }
    [Range(1, 90)] public int BookingWindowDays { get; init; }
    [Range(0, 100)] public decimal DefaultTaxRate { get; init; }
}

public sealed record HolidayDto(int Id, DateOnly Date, string Name);

public sealed record SaveHolidayRequest
{
    [Required] public DateOnly Date { get; init; }
    [Required, StringLength(150)] public string Name { get; init; } = string.Empty;
}

// ---- Doctor availability management ----
public sealed record SaveAvailabilityRequest
{
    /// <summary>0 = Sunday … 6 = Saturday.</summary>
    [Required, Range(0, 6)] public int DayOfWeek { get; init; }
    [Required] public TimeOnly StartTime { get; init; }
    [Required] public TimeOnly EndTime { get; init; }
    [Range(5, 120)] public int SlotDurationMinutes { get; init; } = 30;
    public bool IsActive { get; init; } = true;
}

public sealed record AvailabilityDto(
    int Id, int DayOfWeek, string StartTime, string EndTime, int SlotDurationMinutes, bool IsActive);

public sealed record SaveTimeOffRequest
{
    [Required] public DateOnly Date { get; init; }
    public bool IsOff { get; init; } = true;
    public TimeOnly? StartTime { get; init; }
    public TimeOnly? EndTime { get; init; }
}

public sealed record TimeOffDto(int Id, DateOnly Date, bool IsOff, TimeOnly? StartTime, TimeOnly? EndTime);

// ---- Patient profile ----
public sealed record UpdatePatientProfileRequest
{
    public DateOnly? Dob { get; init; }
    public Hospital.Domain.Enums.Gender? Gender { get; init; }
    [StringLength(5)] public string? BloodGroup { get; init; }
    [StringLength(300)] public string? Address { get; init; }
    [StringLength(30)] public string? EmergencyContact { get; init; }
}

public sealed record PatientProfileDto(
    int PatientId,
    int UserId,
    string FullName,
    string Email,
    string Phone,
    DateOnly? Dob,
    int? Age,
    string? Gender,
    string? BloodGroup,
    string? Address,
    string? EmergencyContact);

public sealed record PatientSummaryDto(int PatientId, string FullName, string Phone, int? Age, string? Gender);

public sealed record RegisterWalkInRequest
{
    [Required, StringLength(150, MinimumLength = 3)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress] public string Email { get; init; } = string.Empty;
    [Required, Phone] public string Phone { get; init; } = string.Empty;

    public DateOnly? Dob { get; init; }
    public Hospital.Domain.Enums.Gender? Gender { get; init; }
    [StringLength(5)] public string? BloodGroup { get; init; }
    [StringLength(300)] public string? Address { get; init; }
    [StringLength(30)] public string? EmergencyContact { get; init; }
}

public sealed record WalkInRegisteredDto(PatientProfileDto Patient, string TemporaryPassword);
