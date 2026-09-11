using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class Invoice
{
    public int Id { get; set; }

    public string Number { get; set; } = string.Empty;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int IssuedByUserId { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;
    public PaymentMethod? PaymentMethod { get; set; }

    public decimal Discount { get; set; }
    public decimal TaxRate { get; set; }

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public decimal Subtotal => Items.Sum(i => i.Amount);
    public decimal TaxAmount => Math.Round((Subtotal - Discount) * (TaxRate / 100m), 2);
    public decimal Total => Math.Round(Subtotal - Discount + TaxAmount, 2);
}

public class InvoiceItem
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }

    public decimal Amount => Quantity * UnitPrice;
}
