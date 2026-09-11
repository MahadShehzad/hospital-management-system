using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

/// <summary>A recorded payment against an invoice, with method-specific details.</summary>
public class Payment
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public PaymentMethod Method { get; set; }
    public decimal Amount { get; set; }

    /// <summary>Transaction id / auth code / cheque no — depends on method.</summary>
    public string? Reference { get; set; }

    // Card
    public string? CardHolder { get; set; }
    public string? CardLast4 { get; set; }

    // Bank transfer
    public string? BankName { get; set; }
    public string? AccountName { get; set; }

    // JazzCash / EasyPaisa
    public string? MobileNumber { get; set; }

    public int ReceivedByUserId { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}
