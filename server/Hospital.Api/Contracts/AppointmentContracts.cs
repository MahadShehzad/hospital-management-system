using System.ComponentModel.DataAnnotations;
using Hospital.Domain.Enums;

namespace Hospital.Api.Contracts;

public sealed record BookAppointmentRequest
{
    [Required]
    public int DoctorId { get; init; }

    [Required]
    public DateTime Start { get; init; }

    [Required, StringLength(500, MinimumLength = 3)]
    public string Reason { get; init; } = string.Empty;
}

public sealed record RescheduleAppointmentRequest
{
    [Required]
    public DateTime Start { get; init; }
}

public sealed record CancelAppointmentRequest
{
    [StringLength(500)]
    public string? Reason { get; init; }
}

public sealed record ChangeStatusRequest
{
    [Required]
    public AppointmentStatus Status { get; init; }

    [StringLength(500)]
    public string? Note { get; init; }
}

public sealed record AppointmentDto(
    int Id,
    int DoctorId,
    string DoctorName,
    string Specialization,
    int PatientId,
    string PatientName,
    DateTime Start,
    DateTime End,
    AppointmentStatus Status,
    string Reason,
    string? CancelledReason,
    decimal ConsultationFee,
    DateTime CreatedAt);
