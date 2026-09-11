using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

/// <summary>A token in a doctor's walk-in / waiting queue for a given day.</summary>
public class QueueEntry
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public DateOnly Date { get; set; }
    public int TokenNumber { get; set; }
    public QueueStatus Status { get; set; } = QueueStatus.Waiting;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CalledAt { get; set; }
    public string? Notes { get; set; }
}
