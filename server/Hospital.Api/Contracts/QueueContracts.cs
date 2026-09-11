using System.ComponentModel.DataAnnotations;
using Hospital.Domain.Enums;

namespace Hospital.Api.Contracts;

public sealed record AddToQueueRequest
{
    [Required] public int DoctorId { get; init; }
    [Required] public int PatientId { get; init; }
    public int? AppointmentId { get; init; }
    [StringLength(500)] public string? Notes { get; init; }
}

public sealed record UpdateQueueStatusRequest
{
    [Required] public QueueStatus Status { get; init; }
}

public sealed record QueueEntryDto(
    int Id,
    int DoctorId,
    string DoctorName,
    int PatientId,
    string PatientName,
    string PatientPhone,
    int TokenNumber,
    QueueStatus Status,
    DateOnly Date,
    DateTime CreatedAt,
    DateTime? CalledAt,
    string? Notes);
