using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class SettingsService(AppDbContext db)
{
    public async Task<ClinicSettingsDto> GetAsync(CancellationToken ct)
    {
        var s = await GetOrCreateAsync(ct);
        return new ClinicSettingsDto
        {
            ClinicName = s.ClinicName,
            Address = s.Address,
            Phone = s.Phone,
            Email = s.Email,
            OpenTime = s.OpenTime,
            CloseTime = s.CloseTime,
            BookingLeadHours = s.BookingLeadHours,
            BookingWindowDays = s.BookingWindowDays,
            DefaultTaxRate = s.DefaultTaxRate,
        };
    }

    public async Task<ClinicSettingsDto> UpdateAsync(ClinicSettingsDto dto, CancellationToken ct)
    {
        var s = await GetOrCreateAsync(ct);
        s.ClinicName = dto.ClinicName.Trim();
        s.Address = dto.Address?.Trim();
        s.Phone = dto.Phone?.Trim();
        s.Email = dto.Email?.Trim();
        s.OpenTime = dto.OpenTime;
        s.CloseTime = dto.CloseTime;
        s.BookingLeadHours = dto.BookingLeadHours;
        s.BookingWindowDays = dto.BookingWindowDays;
        s.DefaultTaxRate = dto.DefaultTaxRate;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<IReadOnlyList<HolidayDto>> GetHolidaysAsync(CancellationToken ct) =>
        await db.Holidays.OrderBy(h => h.Date)
            .Select(h => new HolidayDto(h.Id, h.Date, h.Name))
            .ToListAsync(ct);

    public async Task<HolidayDto> AddHolidayAsync(SaveHolidayRequest request, CancellationToken ct)
    {
        var existing = await db.Holidays.FirstOrDefaultAsync(h => h.Date == request.Date, ct);
        if (existing is not null)
        {
            existing.Name = request.Name.Trim();
        }
        else
        {
            existing = new Holiday { Date = request.Date, Name = request.Name.Trim() };
            db.Holidays.Add(existing);
        }
        await db.SaveChangesAsync(ct);
        return new HolidayDto(existing.Id, existing.Date, existing.Name);
    }

    public async Task DeleteHolidayAsync(int id, CancellationToken ct)
    {
        var h = await db.Holidays.FindAsync([id], ct) ?? throw new KeyNotFoundException("Holiday not found.");
        db.Holidays.Remove(h);
        await db.SaveChangesAsync(ct);
    }

    private async Task<ClinicSetting> GetOrCreateAsync(CancellationToken ct)
    {
        var s = await db.ClinicSettings.FirstOrDefaultAsync(ct);
        if (s is null)
        {
            s = new ClinicSetting();
            db.ClinicSettings.Add(s);
            await db.SaveChangesAsync(ct);
        }
        return s;
    }
}
