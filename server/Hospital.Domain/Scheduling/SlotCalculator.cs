using Hospital.Domain.Entities;

namespace Hospital.Domain.Scheduling;

public readonly record struct TimeSlot(DateTime Start, DateTime End)
{
    public bool Overlaps(DateTime otherStart, DateTime otherEnd) =>
        Start < otherEnd && otherStart < End;
}

/// <summary>
/// Pure, side-effect-free computation of a doctor's bookable slots. All times are
/// treated as clinic-local wall-clock <see cref="DateTime"/> values (Kind = Unspecified).
/// </summary>
public static class SlotCalculator
{
    /// <param name="availabilities">The doctor's recurring weekly windows.</param>
    /// <param name="exceptions">Per-date overrides (day off / replacement window).</param>
    /// <param name="booked">Start/end of appointments that still occupy a slot (i.e. not cancelled).</param>
    /// <param name="fromDate">First calendar day to consider (inclusive).</param>
    /// <param name="toDate">Last calendar day to consider (inclusive).</param>
    /// <param name="now">Current clinic-local time; slots starting at or before <c>now + minLead</c> are dropped.</param>
    /// <param name="minLead">Minimum notice required before a slot can be booked.</param>
    public static IReadOnlyList<TimeSlot> Generate(
        IEnumerable<DoctorAvailability> availabilities,
        IEnumerable<DoctorAvailabilityException> exceptions,
        IEnumerable<(DateTime Start, DateTime End)> booked,
        DateOnly fromDate,
        DateOnly toDate,
        DateTime now,
        TimeSpan? minLead = null)
    {
        if (toDate < fromDate)
            return [];

        var lead = minLead ?? TimeSpan.Zero;
        var earliest = now + lead;

        var activeWindows = availabilities.Where(a => a.IsActive).ToList();
        var exceptionsByDate = exceptions
            .GroupBy(e => e.Date)
            .ToDictionary(g => g.Key, g => g.First());
        var bookedList = booked.ToList();

        var results = new List<TimeSlot>();

        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            IEnumerable<(TimeOnly Start, TimeOnly End, int Duration)> windows;

            if (exceptionsByDate.TryGetValue(date, out var ex))
            {
                if (ex.IsOff)
                    continue;

                if (ex.StartTime is { } exStart && ex.EndTime is { } exEnd)
                {
                    windows = [(exStart, exEnd, ex.SlotDurationMinutes ?? 30)];
                }
                else
                {
                    windows = WindowsForWeekday(activeWindows, date.DayOfWeek);
                }
            }
            else
            {
                windows = WindowsForWeekday(activeWindows, date.DayOfWeek);
            }

            foreach (var window in windows)
            {
                if (window.Duration <= 0 || window.End <= window.Start)
                    continue;

                var step = TimeSpan.FromMinutes(window.Duration);
                var slotStart = date.ToDateTime(window.Start);
                var windowEnd = date.ToDateTime(window.End);

                while (slotStart + step <= windowEnd)
                {
                    var slotEnd = slotStart + step;
                    var slot = new TimeSlot(slotStart, slotEnd);

                    var isFree = slotStart > earliest
                                 && !bookedList.Any(b => slot.Overlaps(b.Start, b.End));

                    if (isFree)
                        results.Add(slot);

                    slotStart = slotEnd;
                }
            }
        }

        return results
            .OrderBy(s => s.Start)
            .DistinctBy(s => s.Start)
            .ToList();
    }

    private static IEnumerable<(TimeOnly Start, TimeOnly End, int Duration)> WindowsForWeekday(
        IEnumerable<DoctorAvailability> windows, DayOfWeek day) =>
        windows
            .Where(a => a.DayOfWeek == day)
            .Select(a => (a.StartTime, a.EndTime, a.SlotDurationMinutes));
}
