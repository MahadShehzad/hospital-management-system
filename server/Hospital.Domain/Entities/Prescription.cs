namespace Hospital.Domain.Entities;

public class Prescription
{
    public int Id { get; set; }

    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;

    public string? Diagnosis { get; set; }
    public string? Notes { get; set; }
    public DateOnly? FollowUpDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}
