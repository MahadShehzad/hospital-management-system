using Hospital.Domain.Entities;
using Hospital.Domain.Scheduling;

namespace Hospital.Tests;

public class SlotCalculatorTests
{
    // A fixed Monday well in the past-free future for deterministic tests.
    private static readonly DateOnly Monday = new(2026, 9, 14);
    private static readonly DateTime NowBeforeMonday = new(2026, 9, 13, 8, 0, 0);

    private static DoctorAvailability Window(DayOfWeek day, int startHour, int endHour, int slot = 30) => new()
    {
        DoctorId = 1,
        DayOfWeek = day,
        StartTime = new TimeOnly(startHour, 0),
        EndTime = new TimeOnly(endHour, 0),
        SlotDurationMinutes = slot,
        IsActive = true,
    };

    [Fact]
    public void Generates_contiguous_slots_across_a_window()
    {
        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 12)],
            [],
            [],
            Monday, Monday, NowBeforeMonday);

        Assert.Equal(6, slots.Count);
        Assert.Equal(new DateTime(2026, 9, 14, 9, 0, 0), slots[0].Start);
        Assert.Equal(new DateTime(2026, 9, 14, 9, 30, 0), slots[0].End);
        Assert.Equal(new DateTime(2026, 9, 14, 11, 30, 0), slots[^1].Start);
    }

    [Fact]
    public void Ignores_inactive_windows_and_other_weekdays()
    {
        var inactive = Window(DayOfWeek.Monday, 9, 12);
        inactive.IsActive = false;

        var slots = SlotCalculator.Generate(
            [inactive, Window(DayOfWeek.Tuesday, 9, 12)],
            [],
            [],
            Monday, Monday, NowBeforeMonday);

        Assert.Empty(slots);
    }

    [Fact]
    public void Excludes_slots_overlapping_a_booked_appointment()
    {
        var booked = new[] { (new DateTime(2026, 9, 14, 9, 30, 0), new DateTime(2026, 9, 14, 10, 0, 0)) };

        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 11)],
            [],
            booked,
            Monday, Monday, NowBeforeMonday);

        Assert.DoesNotContain(slots, s => s.Start == new DateTime(2026, 9, 14, 9, 30, 0));
        Assert.Contains(slots, s => s.Start == new DateTime(2026, 9, 14, 9, 0, 0));
        Assert.Contains(slots, s => s.Start == new DateTime(2026, 9, 14, 10, 0, 0));
    }

    [Fact]
    public void Drops_slots_that_start_before_now_plus_lead()
    {
        var now = new DateTime(2026, 9, 14, 9, 45, 0);

        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 12)],
            [],
            [],
            Monday, Monday, now, TimeSpan.FromHours(1));

        // now + 1h lead = 10:45 -> first bookable slot starts 11:00
        Assert.Equal(new DateTime(2026, 9, 14, 11, 0, 0), slots[0].Start);
    }

    [Fact]
    public void Day_off_exception_removes_all_slots_for_that_date()
    {
        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 12)],
            [new DoctorAvailabilityException { DoctorId = 1, Date = Monday, IsOff = true }],
            [],
            Monday, Monday, NowBeforeMonday);

        Assert.Empty(slots);
    }

    [Fact]
    public void Override_exception_replaces_the_working_window()
    {
        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 12)],
            [new DoctorAvailabilityException
            {
                DoctorId = 1, Date = Monday, IsOff = false,
                StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(15, 0), SlotDurationMinutes = 30,
            }],
            [],
            Monday, Monday, NowBeforeMonday);

        Assert.Equal(2, slots.Count);
        Assert.Equal(new DateTime(2026, 9, 14, 14, 0, 0), slots[0].Start);
    }

    [Fact]
    public void Partial_trailing_time_does_not_produce_a_short_slot()
    {
        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 10, slot: 45)],
            [],
            [],
            Monday, Monday, NowBeforeMonday);

        Assert.Single(slots); // 09:00-09:45 only; 09:45-10:30 would exceed the window
    }

    [Fact]
    public void Empty_range_when_to_is_before_from()
    {
        var slots = SlotCalculator.Generate(
            [Window(DayOfWeek.Monday, 9, 12)],
            [], [],
            Monday, Monday.AddDays(-1), NowBeforeMonday);

        Assert.Empty(slots);
    }
}
