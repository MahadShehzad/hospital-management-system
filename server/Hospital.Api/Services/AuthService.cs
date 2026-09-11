using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Hospital.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed record AuthResult(AuthResponse Response, string RefreshTokenRaw, DateTime RefreshExpiresAt, bool Persistent);

public sealed class AuthService(
    AppDbContext db,
    IPasswordHasher hasher,
    TokenService tokens)
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new BusinessRuleException("An account with that email already exists.");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = hasher.Hash(request.Password),
            Role = UserRole.Patient,
            Phone = request.Phone.Trim(),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        db.Patients.Add(new Patient { UserId = user.Id });
        await db.SaveChangesAsync(ct);

        // New sign-ups start as a session (browser-close ends it).
        return await IssueAsync(user, persistent: false, ct);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !user.IsActive || !hasher.Verify(request.Password, user.PasswordHash))
            throw new BusinessRuleException("Invalid email or password.");

        return await IssueAsync(user, request.RememberMe, ct);
    }

    public async Task<AuthResult> RefreshAsync(string? refreshTokenRaw, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshTokenRaw))
            throw new UnauthorizedAccessException("Missing refresh token.");

        var hash = TokenService.Hash(refreshTokenRaw);
        var token = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token is null || !token.IsActive)
            throw new UnauthorizedAccessException("Invalid or expired session.");

        // Rotate, keeping the same persistence choice.
        var issued = await IssueAsync(token.User, token.Persistent, ct);
        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByTokenHash = TokenService.Hash(issued.RefreshTokenRaw);
        await db.SaveChangesAsync(ct);

        return issued;
    }

    public async Task LogoutAsync(string? refreshTokenRaw, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshTokenRaw))
            return;

        var hash = TokenService.Hash(refreshTokenRaw);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is { RevokedAt: null })
        {
            token.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task<UserDto> GetCurrentAsync(int userId, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new KeyNotFoundException("User not found.");
        return ToDto(user);
    }

    private async Task<AuthResult> IssueAsync(User user, bool persistent, CancellationToken ct)
    {
        var (access, accessExpires) = tokens.CreateAccessToken(user);
        var (raw, refreshHash, refreshExpires) = tokens.CreateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpires,
            Persistent = persistent,
        });
        await db.SaveChangesAsync(ct);

        var response = new AuthResponse(access, accessExpires, ToDto(user));
        return new AuthResult(response, raw, refreshExpires, persistent);
    }

    private static UserDto ToDto(User u) => new(u.Id, u.FullName, u.Email, u.Role, u.Phone);
}
