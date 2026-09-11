using System.ComponentModel.DataAnnotations;
using Hospital.Domain.Enums;

namespace Hospital.Api.Contracts;

public sealed record InvoiceLineDto
{
    [Required, StringLength(300)]
    public string Description { get; init; } = string.Empty;

    [Range(1, 999)] public int Quantity { get; init; } = 1;
    [Range(0, 9_999_999)] public decimal UnitPrice { get; init; }
}

public sealed record CreateInvoiceRequest
{
    [Required] public int PatientId { get; init; }
    public int? AppointmentId { get; init; }

    [Range(0, 9_999_999)] public decimal Discount { get; init; }
    [Range(0, 100)] public decimal TaxRate { get; init; }

    [StringLength(1000)] public string? Notes { get; init; }

    [MinLength(1)]
    public List<InvoiceLineDto> Items { get; init; } = [];
}

public sealed record PayInvoiceRequest
{
    [Required] public PaymentMethod Method { get; init; }

    [StringLength(100)] public string? Reference { get; init; }

    // Card
    [StringLength(120)] public string? CardHolder { get; init; }
    [StringLength(4, MinimumLength = 4)] public string? CardLast4 { get; init; }

    // Bank transfer
    [StringLength(120)] public string? BankName { get; init; }
    [StringLength(120)] public string? AccountName { get; init; }

    // JazzCash / EasyPaisa
    [StringLength(20)] public string? MobileNumber { get; init; }
}

public sealed record PaymentDto(
    int Id,
    PaymentMethod Method,
    decimal Amount,
    string? Reference,
    string? CardHolder,
    string? CardLast4,
    string? BankName,
    string? AccountName,
    string? MobileNumber,
    DateTime PaidAt);

public sealed record InvoiceItemViewDto(int Id, string Description, int Quantity, decimal UnitPrice, decimal Amount);

public sealed record InvoiceDto(
    int Id,
    string Number,
    int PatientId,
    string PatientName,
    int? AppointmentId,
    InvoiceStatus Status,
    PaymentMethod? PaymentMethod,
    decimal Subtotal,
    decimal Discount,
    decimal TaxRate,
    decimal TaxAmount,
    decimal Total,
    DateTime IssuedAt,
    DateTime? PaidAt,
    string? Notes,
    IReadOnlyList<InvoiceItemViewDto> Items,
    IReadOnlyList<PaymentDto> Payments,
    string ClinicName,
    string? ClinicAddress,
    string? ClinicPhone);
