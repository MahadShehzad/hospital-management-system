import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BillingService } from '../../core/services/clinical.service';
import { Invoice, PAYMENT_METHODS, PaymentMethod } from '../../core/models';

@Component({
  selector: 'app-payment-dialog',
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-dialog.component.html',
})
export class PaymentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly billing = inject(BillingService);
  readonly modal = inject(NgbActiveModal);

  invoice!: Invoice;
  readonly methods = PAYMENT_METHODS;
  readonly saving = signal(false);
  readonly method = signal<PaymentMethod>('Cash');

  readonly form = this.fb.nonNullable.group({
    reference: [''],
    cardHolder: [''],
    cardLast4: [''],
    bankName: [''],
    accountName: [''],
    mobileNumber: [''],
  });

  readonly showCard = computed(() => this.method() === 'Card');
  readonly showBank = computed(() => this.method() === 'BankTransfer');
  readonly showMobile = computed(() => this.method() === 'JazzCash' || this.method() === 'EasyPaisa');

  pick(m: PaymentMethod) {
    this.method.set(m);
  }

  submit() {
    const m = this.method();
    const v = this.form.getRawValue();

    // client-side hints matching the server rules
    if (m === 'Card' && v.cardLast4.trim().length !== 4) {
      this.form.controls.cardLast4.setErrors({ required: true });
      return;
    }
    if (m === 'BankTransfer' && (!v.bankName.trim() || !v.reference.trim())) {
      if (!v.bankName.trim()) this.form.controls.bankName.setErrors({ required: true });
      if (!v.reference.trim()) this.form.controls.reference.setErrors({ required: true });
      return;
    }
    if ((m === 'JazzCash' || m === 'EasyPaisa') && (!v.mobileNumber.trim() || !v.reference.trim())) {
      if (!v.mobileNumber.trim()) this.form.controls.mobileNumber.setErrors({ required: true });
      if (!v.reference.trim()) this.form.controls.reference.setErrors({ required: true });
      return;
    }

    this.saving.set(true);
    this.billing
      .pay(this.invoice.id, {
        method: m,
        reference: v.reference.trim() || undefined,
        cardHolder: v.cardHolder.trim() || undefined,
        cardLast4: v.cardLast4.trim() || undefined,
        bankName: v.bankName.trim() || undefined,
        accountName: v.accountName.trim() || undefined,
        mobileNumber: v.mobileNumber.trim() || undefined,
      })
      .subscribe({
        next: (inv) => this.modal.close(inv),
        error: () => this.saving.set(false),
      });
  }
}
