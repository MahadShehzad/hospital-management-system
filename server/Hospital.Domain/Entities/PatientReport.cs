namespace Hospital.Domain.Entities;

public enum ReportType
{
    Lab = 0,
    Radiology = 1,
    Procedure = 2,
    Discharge = 3,
    Referral = 4,
    Other = 5
}

/// <summary>
/// A clinical report a doctor records for a patient (lab result, imaging summary,
/// discharge note, …). Text-based so it works without file storage.
/// </summary>
public class PatientReport
{
    public int Id { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string Title { get; set; } = string.Empty;
    public ReportType Type { get; set; } = ReportType.Other;
    public DateOnly ReportDate { get; set; }

    public string? Summary { get; set; }
    public string? Findings { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
