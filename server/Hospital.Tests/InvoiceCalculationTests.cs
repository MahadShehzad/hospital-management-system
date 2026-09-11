using Hospital.Domain.Entities;

namespace Hospital.Tests;

public class InvoiceCalculationTests
{
    private static Invoice Make(decimal discount, decimal taxRate, params (int qty, decimal price)[] lines)
    {
        var invoice = new Invoice { Discount = discount, TaxRate = taxRate };
        foreach (var (qty, price) in lines)
            invoice.Items.Add(new InvoiceItem { Quantity = qty, UnitPrice = price });
        return invoice;
    }

    [Fact]
    public void Subtotal_sums_line_amounts()
    {
        var invoice = Make(0, 0, (2, 500m), (1, 1500m));
        Assert.Equal(2500m, invoice.Subtotal);
    }

    [Fact]
    public void Tax_applies_after_discount()
    {
        var invoice = Make(discount: 500m, taxRate: 10m, (1, 2500m));
        // (2500 - 500) * 10% = 200
        Assert.Equal(200m, invoice.TaxAmount);
        Assert.Equal(2200m, invoice.Total);
    }

    [Fact]
    public void Zero_tax_leaves_total_as_subtotal_minus_discount()
    {
        var invoice = Make(discount: 250m, taxRate: 0m, (3, 1000m));
        Assert.Equal(0m, invoice.TaxAmount);
        Assert.Equal(2750m, invoice.Total);
    }

    [Fact]
    public void Item_amount_is_quantity_times_unit_price()
    {
        var item = new InvoiceItem { Quantity = 4, UnitPrice = 125.5m };
        Assert.Equal(502m, item.Amount);
    }
}
