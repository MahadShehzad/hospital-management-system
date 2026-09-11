namespace Hospital.Domain.Entities;

/// <summary>Singleton row (Id = 1) holding clinic-wide configuration.</summary>
public class ClinicSetting
{
    public int Id { get; set; }

    public string ClinicName { get; set; } = "MediCare Clinic";
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }

    public TimeOnly OpenTime { get; set; } = new(9, 0);
    public TimeOnly CloseTime { get; set; } = new(21, 0);

    /// <summary>Minimum notice (hours) required before a slot can be booked.</summary>
    public int BookingLeadHours { get; set; } = 1;

    /// <summary>How many days ahead patients may book.</summary>
    public int BookingWindowDays { get; set; } = 14;

    public decimal DefaultTaxRate { get; set; } = 0m;
}
