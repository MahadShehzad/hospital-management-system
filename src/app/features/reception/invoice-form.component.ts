import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BillingService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientSummary } from '../../core/models';
import { PatientPickerComponent } from '../../shared/components/patient-picker.component';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule, DecimalPipe, PatientPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-form.component.html',
})
export class InvoiceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly billing = inject(BillingService);
  private readonly notify = inject(NotificationService);
  readonly modal = inject(NgbActiveModal);

  readonly patient = signal<PatientSummary | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    discount: [0, [Validators.min(0)]],
    taxRate: [0, [Validators.min(0), Validators.max(100)]],
    notes: [''],
    items: this.fb.array([this.line('Consultation fee', 1, 0)]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  readonly totals = signal({ subtotal: 0, tax: 0, total: 0 });

  constructor() {
    this.form.valueChanges
      .pipe(startWith(null), takeUntilDestroyed())
      .subscribe(() => this.totals.set(this.recompute()));
  }

  private recompute() {
    const raw = this.form.getRawValue();
    const subtotal = raw.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
    const taxable = Math.max(0, subtotal - (raw.discount || 0));
    const tax = (taxable * (raw.taxRate || 0)) / 100;
    return { subtotal, tax, total: taxable + tax };
  }

  private line(desc = '', qty = 1, price = 0) {
    return this.fb.nonNullable.group({
      description: [desc, Validators.required],
      quantity: [qty, [Validators.required, Validators.min(1)]],
      unitPrice: [price, [Validators.required, Validators.min(0)]],
    });
  }

  addLine() {
    this.items.push(this.line());
  }
  removeLine(i: number) {
    this.items.removeAt(i);
    if (this.items.length === 0) this.addLine();
  }

  submit() {
    const p = this.patient();
    if (!p) {
      this.notify.error('Select a patient.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.billing
      .create({
        patientId: p.patientId,
        discount: v.discount,
        taxRate: v.taxRate,
        notes: v.notes || undefined,
        items: v.items,
      })
      .subscribe({
        next: (inv) => this.modal.close(inv),
        error: () => this.saving.set(false),
      });
  }
}
