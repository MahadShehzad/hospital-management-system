using Hospital.Api.Auth;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Exceptions;
using Hospital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Api.Services;

public sealed class BillingService(AppDbContext db, ICurrentUser currentUser)
{
    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct)
    {
        var patient = await db.Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == request.PatientId, ct)
            ?? throw new KeyNotFoundException("Patient not found.");

        if (request.Items.Count == 0)
            throw new BusinessRuleException("An invoice needs at least one line item.");

        if (request.AppointmentId is { } apptId &&
            !await db.Appointments.AnyAsync(a => a.Id == apptId && a.PatientId == request.PatientId, ct))
            throw new BusinessRuleException("That appointment does not belong to the patient.");

        var invoice = new Invoice
        {
            Number = await NextNumberAsync(ct),
            PatientId = patient.Id,
            AppointmentId = request.AppointmentId,
            IssuedByUserId = currentUser.UserId,
            Discount = request.Discount,
            TaxRate = request.TaxRate,
            Notes = request.Notes?.Trim(),
            Items = request.Items.Select(i => new InvoiceItem
            {
                Description = i.Description.Trim(),
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
            }).ToList(),
        };

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);
        return await GetAsync(invoice.Id, ct);
    }

    public async Task<IReadOnlyList<InvoiceDto>> ListAsync(
        InvoiceStatus? status, int? patientId, DateOnly? from, DateOnly? to, CancellationToken ct)
    {
        var query = BaseQuery();

        if (status is { } s) query = query.Where(i => i.Status == s);
        if (patientId is { } pid) query = query.Where(i => i.PatientId == pid);
        if (from is { } f) query = query.Where(i => i.IssuedAt >= f.ToDateTime(TimeOnly.MinValue));
        if (to is { } t) query = query.Where(i => i.IssuedAt < t.AddDays(1).ToDateTime(TimeOnly.MinValue));

        var list = await query.OrderByDescending(i => i.IssuedAt).Take(200).ToListAsync(ct);
        var settings = await db.ClinicSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        return list.Select(i => Project(i, settings)).ToList();
    }

    public async Task<InvoiceDto> GetAsync(int id, CancellationToken ct)
    {
        var invoice = await BaseQuery().FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (currentUser.Role == UserRole.Patient && invoice.Patient.UserId != currentUser.UserId)
            throw new ForbiddenException("This invoice is not yours.");

        var settings = await db.ClinicSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        return Project(invoice, settings);
    }

    public async Task<IReadOnlyList<InvoiceDto>> GetMineAsync(CancellationToken ct)
    {
        var list = await BaseQuery()
            .Where(i => i.Patient.UserId == currentUser.UserId)
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync(ct);
        var settings = await db.ClinicSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        return list.Select(i => Project(i, settings)).ToList();
    }

    public async Task<InvoiceDto> PayAsync(int id, PayInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await db.Invoices.Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (invoice.Status != InvoiceStatus.Unpaid)
            throw new BusinessRuleException($"Invoice is already {invoice.Status}.");

        ValidatePaymentDetails(request);

        var paidAt = DateTime.UtcNow;
        invoice.Status = InvoiceStatus.Paid;
        invoice.PaymentMethod = request.Method;
        invoice.PaidAt = paidAt;
        db.Payments.Add(new Payment
        {
            InvoiceId = invoice.Id,
            Method = request.Method,
            Amount = invoice.Total,
            Reference = request.Reference?.Trim(),
            CardHolder = request.CardHolder?.Trim(),
            CardLast4 = request.CardLast4?.Trim(),
            BankName = request.BankName?.Trim(),
            AccountName = request.AccountName?.Trim(),
            MobileNumber = request.MobileNumber?.Trim(),
            ReceivedByUserId = currentUser.UserId,
            PaidAt = paidAt,
        });
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<InvoiceDto> VoidAsync(int id, CancellationToken ct)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (invoice.Status == InvoiceStatus.Paid)
            throw new BusinessRuleException("A paid invoice cannot be voided.");

        invoice.Status = InvoiceStatus.Void;
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    private static void ValidatePaymentDetails(PayInvoiceRequest r)
    {
        switch (r.Method)
        {
            case PaymentMethod.Card when string.IsNullOrWhiteSpace(r.CardLast4) || r.CardLast4!.Length != 4:
                throw new BusinessRuleException("Enter the last 4 digits of the card.");
            case PaymentMethod.BankTransfer when string.IsNullOrWhiteSpace(r.BankName) || string.IsNullOrWhiteSpace(r.Reference):
                throw new BusinessRuleException("Bank name and transaction reference are required.");
            case PaymentMethod.JazzCash or PaymentMethod.EasyPaisa
                when string.IsNullOrWhiteSpace(r.MobileNumber) || string.IsNullOrWhiteSpace(r.Reference):
                throw new BusinessRuleException("Mobile number and transaction id are required.");
        }
    }

    private IQueryable<Invoice> BaseQuery() =>
        db.Invoices
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .Include(i => i.Patient).ThenInclude(p => p.User);

    private async Task<string> NextNumberAsync(CancellationToken ct)
    {
        var year = DateTime.Now.Year;
        var prefix = $"INV-{year}-";
        var count = await db.Invoices.CountAsync(i => i.Number.StartsWith(prefix), ct);
        return $"{prefix}{(count + 1):D5}";
    }

    private static InvoiceDto Project(Invoice i, ClinicSetting? settings) => new(
        i.Id,
        i.Number,
        i.PatientId,
        i.Patient.User.FullName,
        i.AppointmentId,
        i.Status,
        i.PaymentMethod,
        i.Subtotal,
        i.Discount,
        i.TaxRate,
        i.TaxAmount,
        i.Total,
        i.IssuedAt,
        i.PaidAt,
        i.Notes,
        i.Items.Select(x => new InvoiceItemViewDto(x.Id, x.Description, x.Quantity, x.UnitPrice, x.Amount)).ToList(),
        i.Payments.OrderBy(x => x.PaidAt).Select(x => new PaymentDto(
            x.Id, x.Method, x.Amount, x.Reference, x.CardHolder, x.CardLast4,
            x.BankName, x.AccountName, x.MobileNumber, x.PaidAt)).ToList(),
        settings?.ClinicName ?? "MediCare Clinic",
        settings?.Address,
        settings?.Phone);
}
