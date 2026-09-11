using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Domain.Scheduling;

namespace Hospital.Tests;

public class AppointmentStateMachineTests
{
    [Theory]
    [InlineData(AppointmentStatus.Pending, AppointmentStatus.Confirmed)]
    [InlineData(AppointmentStatus.Pending, AppointmentStatus.Cancelled)]
    [InlineData(AppointmentStatus.Confirmed, AppointmentStatus.Completed)]
    [InlineData(AppointmentStatus.Confirmed, AppointmentStatus.NoShow)]
    [InlineData(AppointmentStatus.Confirmed, AppointmentStatus.Cancelled)]
    public void Allows_valid_transitions(AppointmentStatus from, AppointmentStatus to)
    {
        Assert.True(AppointmentStateMachine.CanTransition(from, to));
        AppointmentStateMachine.EnsureCanTransition(from, to); // does not throw
    }

    [Theory]
    [InlineData(AppointmentStatus.Completed, AppointmentStatus.Pending)]
    [InlineData(AppointmentStatus.Completed, AppointmentStatus.Cancelled)]
    [InlineData(AppointmentStatus.Cancelled, AppointmentStatus.Confirmed)]
    [InlineData(AppointmentStatus.NoShow, AppointmentStatus.Completed)]
    [InlineData(AppointmentStatus.Pending, AppointmentStatus.Completed)]
    [InlineData(AppointmentStatus.Pending, AppointmentStatus.NoShow)]
    [InlineData(AppointmentStatus.Confirmed, AppointmentStatus.Pending)]
    public void Blocks_invalid_transitions(AppointmentStatus from, AppointmentStatus to)
    {
        Assert.False(AppointmentStateMachine.CanTransition(from, to));
        Assert.Throws<InvalidStatusTransitionException>(() => AppointmentStateMachine.EnsureCanTransition(from, to));
    }

    [Fact]
    public void Same_state_is_not_a_transition()
    {
        Assert.False(AppointmentStateMachine.CanTransition(AppointmentStatus.Pending, AppointmentStatus.Pending));
    }

    [Fact]
    public void Terminal_states_have_no_next()
    {
        Assert.Empty(AppointmentStateMachine.NextStates(AppointmentStatus.Completed));
        Assert.Empty(AppointmentStateMachine.NextStates(AppointmentStatus.Cancelled));
        Assert.Empty(AppointmentStateMachine.NextStates(AppointmentStatus.NoShow));
    }
}
