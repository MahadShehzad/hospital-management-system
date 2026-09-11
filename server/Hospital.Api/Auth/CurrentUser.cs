using System.Security.Claims;
using Hospital.Domain.Enums;

namespace Hospital.Api.Auth;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    int UserId { get; }
    UserRole Role { get; }
    string Email { get; }
}

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public int UserId =>
        int.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException("No authenticated user.");

    public UserRole Role =>
        Enum.TryParse<UserRole>(Principal?.FindFirstValue(ClaimTypes.Role), out var role)
            ? role
            : throw new UnauthorizedAccessException("No role on the current principal.");

    public string Email => Principal?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
}
