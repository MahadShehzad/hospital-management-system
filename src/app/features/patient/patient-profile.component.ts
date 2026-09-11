import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PatientDirectoryService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientProfile } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { ageRangeValidator, notFutureDateValidator, phoneValidator } from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-patient-profile',
  imports: [ReactiveFormsModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-profile.component.html',
})
export class PatientProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dir = inject(PatientDirectoryService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly profile = signal<PatientProfile | null>(null);

  readonly form = this.fb.nonNullable.group({
    dob: ['', [notFutureDateValidator(), ageRangeValidator(0, 120)]],
    gender: ['' as '' | 'Male' | 'Female' | 'Other'],
    bloodGroup: [''],
    address: [''],
    emergencyContact: ['', [phoneValidator()]],
  });

  constructor() {
    this.dir.me().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form.patchValue({
          dob: p.dob ? p.dob.slice(0, 10) : '',
          gender: (p.gender as '' | 'Male' | 'Female' | 'Other') ?? '',
          bloodGroup: p.bloodGroup ?? '',
          address: p.address ?? '',
          emergencyContact: p.emergencyContact ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  invalid(c: string) {
    const ctrl = this.form.get(c);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.dir
      .updateMe({
        dob: v.dob || null,
        gender: (v.gender || null) as PatientProfile['gender'],
        bloodGroup: v.bloodGroup || null,
        address: v.address || null,
        emergencyContact: v.emergencyContact || null,
      })
      .subscribe({
        next: (p) => {
          this.profile.set(p);
          this.saving.set(false);
          this.notify.success('Profile updated.');
        },
        error: () => this.saving.set(false),
      });
  }
}
