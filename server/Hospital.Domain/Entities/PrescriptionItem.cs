namespace Hospital.Domain.Entities;

public class PrescriptionItem
{
    public int Id { get; set; }

    public int PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;

    public string MedicineName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public int? DurationDays { get; set; }
    public string? Instructions { get; set; }
}
