import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Slot } from '../../core/models';

@Component({
  selector: 'app-book-confirm',
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Confirm appointment</h5>
      <button type="button" class="btn-close" (click)="modal.dismiss()" aria-label="Close"></button>
    </div>
    <form [formGroup]="form" (ngSubmit)="confirm()">
      <div class="modal-body">
        <p class="mb-1"><strong>{{ doctorName }}</strong></p>
        <p class="text-secondary">
          <i class="bi bi-calendar-event me-1"></i>
          {{ slot.start | date: 'EEEE, d MMM y' }} at {{ slot.start | date: 'shortTime' }}
        </p>
        <label class="form-label" for="reason">Reason for visit</label>
        <textarea
          id="reason"
          class="form-control"
          rows="3"
          formControlName="reason"
          [class.is-invalid]="reasonInvalid"
        ></textarea>
        <div class="invalid-feedback">Please describe the reason (at least 3 characters).</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss()">Cancel</button>
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-check2-circle me-1"></i> Book slot
        </button>
      </div>
    </form>
  `,
})
export class BookConfirmComponent {
  private readonly fb = inject(FormBuilder);
  readonly modal = inject(NgbActiveModal);

  slot!: Slot;
  doctorName = '';

  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  get reasonInvalid(): boolean {
    const c = this.form.get('reason')!;
    return c.invalid && (c.touched || c.dirty);
  }

  confirm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.modal.close(this.form.getRawValue().reason.trim());
  }
}
