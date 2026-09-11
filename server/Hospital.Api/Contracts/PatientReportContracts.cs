using System.ComponentModel.DataAnnotations;
using Hospital.Domain.Entities;

namespace Hospital.Api.Contracts;

public sealed record SavePatientReportRequest
{
    [Required] public int PatientId { get; init; }
    public int? AppointmentId { get; init; }

    [Required, StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [Required] public ReportType Type { get; init; }
    [Required] public DateOnly ReportDate { get; init; }

    [StringLength(2000)] public string? Summary { get; init; }
    [StringLength(4000)] public string? Findings { get; init; }
}

public sealed record PatientReportDto(
    int Id,
    int PatientId,
    string PatientName,
    int DoctorId,
    string DoctorName,
    string DoctorSpecialization,
    int? AppointmentId,
    string Title,
    ReportType Type,
    DateOnly ReportDate,
    string? Summary,
    string? Findings,
    DateTime CreatedAt);
