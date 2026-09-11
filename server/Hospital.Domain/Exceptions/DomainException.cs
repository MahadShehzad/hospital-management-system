namespace Hospital.Domain.Exceptions;

/// <summary>Base type for expected, rule-driven failures that map to 4xx responses.</summary>
public abstract class DomainException(string message) : Exception(message);

/// <summary>A requested appointment status change is not allowed by the state machine.</summary>
public sealed class InvalidStatusTransitionException(string message) : DomainException(message);

/// <summary>The requested slot conflicts with an existing appointment or the doctor's schedule.</summary>
public sealed class SlotUnavailableException(string message) : DomainException(message);

/// <summary>Generic invalid-request rule violation.</summary>
public sealed class BusinessRuleException(string message) : DomainException(message);

/// <summary>The caller is authenticated but not allowed to touch this resource.</summary>
public sealed class ForbiddenException(string message) : DomainException(message);
