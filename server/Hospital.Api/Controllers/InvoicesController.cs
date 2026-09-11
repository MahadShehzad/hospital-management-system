using Hospital.Api.Contracts;
using Hospital.Api.Services;
using Hospital.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public sealed class InvoicesController(BillingService billing) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<IReadOnlyList<InvoiceDto>>> List(
        [FromQuery] InvoiceStatus? status,
        [FromQuery] int? patientId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct) =>
        Ok(await billing.ListAsync(status, patientId, from, to, ct));

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<InvoiceDto>>> Mine(CancellationToken ct) =>
        Ok(await billing.GetMineAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceDto>> Get(int id, CancellationToken ct) =>
        Ok(await billing.GetAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceRequest request, CancellationToken ct)
    {
        var created = await billing.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPatch("{id:int}/pay")]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<InvoiceDto>> Pay(int id, PayInvoiceRequest request, CancellationToken ct) =>
        Ok(await billing.PayAsync(id, request, ct));

    [HttpPatch("{id:int}/void")]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult<InvoiceDto>> Void(int id, CancellationToken ct) =>
        Ok(await billing.VoidAsync(id, ct));
}
