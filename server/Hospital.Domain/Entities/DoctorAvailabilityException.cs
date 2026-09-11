namespace Hospital.Domain.Entities;

/// <summary>
/// One-off override for a specific date: either a full day off (<see cref="IsOff"/> = true)
/// or a replacement working window for that date.
/// </summary>
public class DoctorAvailabilityException
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateOnly Date { get; set; }
    public bool IsOff { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? SlotDurationMinutes { get; set; }
}
