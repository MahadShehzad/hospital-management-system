import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BillingService } from '../../core/services/clinical.service';
import { PdfService } from '../../core/services/pdf.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { Invoice } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { InvoiceFormComponent } from './invoice-form.component';
import { PaymentDialogComponent } from './payment-dialog.component';

@Component({
  selector: 'app-billing',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, LoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.component.html',
})
export class BillingComponent {
  private readonly billing = inject(BillingService);
  private readonly pdf = inject(PdfService);
  private readonly modal = inject(NgbModal);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(true);
  readonly statusFilter = new FormControl<'' | 'Unpaid' | 'Paid' | 'Void'>('', { nonNullable: true });

  constructor() {
    this.load();
    this.statusFilter.valueChanges.subscribe(() => this.load());
  }

  private load() {
    this.loading.set(true);
    this.billing.list({ status: this.statusFilter.value || undefined }).subscribe({
      next: (list) => {
        this.invoices.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  newInvoice() {
    const ref = this.modal.open(InvoiceFormComponent, { size: 'lg', centered: true, scrollable: true });
    ref.result.then(
      (inv: Invoice) => {
        this.notify.success(`Invoice ${inv.number} created.`);
        this.load();
      },
      () => {},
    );
  }

  pay(inv: Invoice) {
    const ref = this.modal.open(PaymentDialogComponent, { centered: true });
    (ref.componentInstance as PaymentDialogComponent).invoice = inv;
    ref.result.then(
      (paid: Invoice) => {
        this.notify.success(`${inv.number} marked paid (${paid.paymentMethod}).`);
        this.load();
      },
      () => {},
    );
  }

  async voidInvoice(inv: Invoice) {
    const ok = await this.confirm.ask({
      title: 'Void invoice?',
      message: `${inv.number} will be marked void.`,
      danger: true,
      confirmText: 'Void it',
    });
    if (!ok) return;
    this.billing.void(inv.id).subscribe({
      next: () => this.load(),
      error: () => this.notify.error('Could not void.'),
    });
  }

  download(inv: Invoice) {
    this.billing.get(inv.id).subscribe((full) => this.pdf.invoice(full));
  }
}
