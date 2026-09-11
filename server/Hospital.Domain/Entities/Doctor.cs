namespace Hospital.Domain.Entities;

public class Doctor
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public string Specialization { get; set; } = string.Empty;
    public string? Qualifications { get; set; }
    public int ExperienceYears { get; set; }

    /// <summary>Standard OPD check-up fee.</summary>
    public decimal ConsultationFee { get; set; }
    /// <summary>Fee for a follow-up visit within the same episode.</summary>
    public decimal FollowUpFee { get; set; }
    /// <summary>Fee for a minor in-clinic procedure.</summary>
    public decimal ProcedureFee { get; set; }
    /// <summary>Indicative fee for a major operation / surgery.</summary>
    public decimal SurgeryFee { get; set; }

    public string? Bio { get; set; }

    public double RatingAvg { get; set; }
    public int RatingCount { get; set; }

    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
    public ICollection<DoctorAvailabilityException> AvailabilityExceptions { get; set; } = new List<DoctorAvailabilityException>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
