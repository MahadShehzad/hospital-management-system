using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class Patient
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateOnly? Dob { get; set; }
    public Gender? Gender { get; set; }
    public string? BloodGroup { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
