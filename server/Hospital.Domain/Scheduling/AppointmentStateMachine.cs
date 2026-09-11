using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;

namespace Hospital.Domain.Scheduling;

/// <summary>
/// Central definition of the appointment lifecycle:
/// Pending -> Confirmed -> Completed | NoShow, with Cancelled reachable from
/// Pending or Confirmed. Terminal states allow no further transitions.
/// </summary>
public static class AppointmentStateMachine
{
    private static readonly IReadOnlyDictionary<AppointmentStatus, AppointmentStatus[]> Allowed =
        new Dictionary<AppointmentStatus, AppointmentStatus[]>
        {
            [AppointmentStatus.Pending] = [AppointmentStatus.Confirmed, AppointmentStatus.Cancelled],
            [AppointmentStatus.Confirmed] = [AppointmentStatus.Completed, AppointmentStatus.NoShow, AppointmentStatus.Cancelled],
            [AppointmentStatus.Completed] = [],
            [AppointmentStatus.Cancelled] = [],
            [AppointmentStatus.NoShow] = [],
        };

    public static IReadOnlyList<AppointmentStatus> NextStates(AppointmentStatus from) => Allowed[from];

    public static bool CanTransition(AppointmentStatus from, AppointmentStatus to) =>
        from != to && Allowed[from].Contains(to);

    public static void EnsureCanTransition(AppointmentStatus from, AppointmentStatus to)
    {
        if (!CanTransition(from, to))
        {
            throw new InvalidStatusTransitionException(
                $"Cannot change appointment status from '{from}' to '{to}'.");
        }
    }
}
