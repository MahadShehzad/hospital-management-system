import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PatientDirectoryService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientProfile } from '../../core/models';
import {
  ageRangeValidator,
  notFutureDateValidator,
  phoneValidator,
} from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-patient-registration',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-registration.component.html',
})
export class PatientRegistrationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dir = inject(PatientDirectoryService);
  private readonly notify = inject(NotificationService);

  readonly saving = signal(false);
  readonly created = signal<{ patient: PatientProfile; temporaryPassword: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator()]],
    dob: ['', [notFutureDateValidator(), ageRangeValidator(0, 120)]],
    gender: ['' as '' | 'Male' | 'Female' | 'Other'],
    bloodGroup: [''],
    address: [''],
    emergencyContact: ['', [phoneValidator()]],
  });

  invalid(c: string) {
    const ctrl = this.form.get(c);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.dir
      .registerWalkIn({
        fullName: v.fullName,
        email: v.email,
        phone: v.phone,
        dob: v.dob || null,
        gender: v.gender || null,
        bloodGroup: v.bloodGroup || null,
        address: v.address || null,
        emergencyContact: v.emergencyContact || null,
      })
      .subscribe({
        next: (res) => {
          this.created.set(res);
          this.saving.set(false);
          this.notify.success('Patient registered.');
        },
        error: () => this.saving.set(false),
      });
  }

  reset() {
    this.created.set(null);
    this.form.reset();
  }
}
