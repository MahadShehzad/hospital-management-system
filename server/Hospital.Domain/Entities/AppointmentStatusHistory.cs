using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class AppointmentStatusHistory
{
    public int Id { get; set; }

    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;

    public AppointmentStatus? FromStatus { get; set; }
    public AppointmentStatus ToStatus { get; set; }

    public int ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }
}
