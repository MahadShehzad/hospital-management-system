using System.ComponentModel.DataAnnotations;

namespace Hospital.Api.Contracts;

public sealed record PrescriptionItemDto
{
    [Required, StringLength(200)]
    public string MedicineName { get; init; } = string.Empty;

    [StringLength(100)] public string? Dosage { get; init; }
    [StringLength(100)] public string? Frequency { get; init; }
    public int? DurationDays { get; init; }
    [StringLength(500)] public string? Instructions { get; init; }
}

public sealed record SavePrescriptionRequest
{
    [StringLength(1000)] public string? Diagnosis { get; init; }
    [StringLength(2000)] public string? Notes { get; init; }
    public DateOnly? FollowUpDate { get; init; }

    [MinLength(1)]
    public List<PrescriptionItemDto> Items { get; init; } = [];
}

public sealed record PrescriptionDto(
    int Id,
    int AppointmentId,
    string DoctorName,
    string DoctorSpecialization,
    string PatientName,
    int? PatientAge,
    string? PatientGender,
    DateTime AppointmentDate,
    string? Diagnosis,
    string? Notes,
    DateOnly? FollowUpDate,
    DateTime CreatedAt,
    IReadOnlyList<PrescriptionItemDto> Items,
    string ClinicName,
    string? ClinicAddress,
    string? ClinicPhone);
