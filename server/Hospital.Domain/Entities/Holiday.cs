namespace Hospital.Domain.Entities;

/// <summary>A clinic-wide non-working day. Used by the slot calculator to close bookings.</summary>
public class Holiday
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
}
