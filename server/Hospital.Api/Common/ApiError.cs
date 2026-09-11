namespace Hospital.Api.Common;

public sealed record ApiError(string Message, string? Code = null, IDictionary<string, string[]>? Errors = null);
