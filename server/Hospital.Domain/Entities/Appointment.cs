using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class Appointment
{
    public int Id { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string Reason { get; set; } = string.Empty;
    public string? CancelledReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AppointmentStatusHistory> StatusHistory { get; set; } = new List<AppointmentStatusHistory>();
    public Prescription? Prescription { get; set; }
}
