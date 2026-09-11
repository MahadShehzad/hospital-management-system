namespace Hospital.Domain.Enums;

public enum InvoiceStatus
{
    Unpaid = 0,
    Paid = 1,
    Void = 2
}

public enum PaymentMethod
{
    Cash = 0,
    Card = 1,
    BankTransfer = 2,
    JazzCash = 3,
    EasyPaisa = 4
}

public enum QueueStatus
{
    Waiting = 0,
    Called = 1,
    InRoom = 2,
    Done = 3,
    Skipped = 4
}
