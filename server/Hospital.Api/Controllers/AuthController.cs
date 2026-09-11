using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService auth, ICurrentUser currentUser, IConfiguration config) : ControllerBase
{
    private const string RefreshCookieName = "refresh_token";

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await auth.RegisterAsync(request, ct);
        SetRefreshCookie(result.RefreshTokenRaw, result.RefreshExpiresAt, result.Persistent);
        return Ok(result.Response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, ct);
        SetRefreshCookie(result.RefreshTokenRaw, result.RefreshExpiresAt, result.Persistent);
        return Ok(result.Response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken ct)
    {
        var raw = Request.Cookies[RefreshCookieName];
        var result = await auth.RefreshAsync(raw, ct);
        SetRefreshCookie(result.RefreshTokenRaw, result.RefreshExpiresAt, result.Persistent);
        return Ok(result.Response);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await auth.LogoutAsync(Request.Cookies[RefreshCookieName], ct);
        Response.Cookies.Delete(RefreshCookieName, CookieOptions());
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct) =>
        Ok(await auth.GetCurrentAsync(currentUser.UserId, ct));

    private void SetRefreshCookie(string value, DateTime expiresUtc, bool persistent)
    {
        var options = CookieOptions();
        // Persistent → cookie survives a browser restart (up to the token's lifetime).
        // Otherwise it is a session cookie and the browser drops it on close.
        if (persistent)
            options.Expires = expiresUtc;
        Response.Cookies.Append(RefreshCookieName, value, options);
    }

    private CookieOptions CookieOptions()
    {
        // Defaults suit same-site dev and the reverse-proxied Docker setup.
        // For a cross-site HTTPS deployment set Cookie:Secure=true and Cookie:SameSite=None.
        var secure = config.GetValue("Cookie:Secure", false);
        var sameSite = Enum.TryParse<SameSiteMode>(config["Cookie:SameSite"], true, out var s) ? s : SameSiteMode.Lax;
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = sameSite,
            Path = "/api/auth",
            IsEssential = true,
        };
    }
}
