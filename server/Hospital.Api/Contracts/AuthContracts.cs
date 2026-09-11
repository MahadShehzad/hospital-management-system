using System.ComponentModel.DataAnnotations;
using Hospital.Domain.Enums;

namespace Hospital.Api.Contracts;

public sealed record RegisterRequest
{
    [Required, StringLength(150, MinimumLength = 3)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;

    [Required, Phone, StringLength(30)]
    public string Phone { get; init; } = string.Empty;
}

public sealed record LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;

    /// <summary>Keep the session across a browser restart.</summary>
    public bool RememberMe { get; init; }
}

public sealed record UserDto(int Id, string FullName, string Email, UserRole Role, string Phone);

public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, UserDto User);
