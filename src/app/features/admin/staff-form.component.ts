import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminApiService } from '../../core/services/clinical.service';
import { Department, Staff } from '../../core/models';
import { phoneValidator, passwordStrengthValidator } from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-staff-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-form.component.html',
})
export class StaffFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  readonly modal = inject(NgbActiveModal);

  departments: Department[] = [];
  existing: Staff | null = null;
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator()]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    role: ['Doctor' as 'Doctor' | 'Receptionist' | 'Admin', Validators.required],
    departmentId: [null as number | null],
    specialization: [''],
    qualifications: [''],
    experienceYears: [0],
    consultationFee: [0],
    followUpFee: [0],
    procedureFee: [0],
    surgeryFee: [0],
    bio: [''],
    isActive: [true],
  });

  get isDoctor() {
    return this.form.controls.role.value === 'Doctor';
  }
  get isEdit() {
    return !!this.existing;
  }

  ngOnInit() {
    if (this.existing) {
      const s = this.existing;
      this.form.patchValue({
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        role: s.role,
        departmentId: s.departmentId ?? null,
        specialization: s.specialization ?? '',
        experienceYears: s.experienceYears ?? 0,
        consultationFee: s.consultationFee ?? 0,
        followUpFee: s.followUpFee ?? 0,
        procedureFee: s.procedureFee ?? 0,
        surgeryFee: s.surgeryFee ?? 0,
        isActive: s.isActive,
      });
      this.form.controls.email.disable();
      this.form.controls.role.disable();
      this.form.controls.password.disable();
    }
  }

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

    if (this.existing) {
      this.api
        .updateStaff(this.existing.userId, {
          fullName: v.fullName,
          phone: v.phone,
          isActive: v.isActive,
          departmentId: v.departmentId ?? undefined,
          specialization: v.specialization || undefined,
          qualifications: v.qualifications || undefined,
          experienceYears: v.experienceYears,
          consultationFee: v.consultationFee,
          followUpFee: v.followUpFee,
          procedureFee: v.procedureFee,
          surgeryFee: v.surgeryFee,
          bio: v.bio || undefined,
        })
        .subscribe({
          next: (s) => this.modal.close({ staff: s }),
          error: () => this.saving.set(false),
        });
    } else {
      this.api
        .createStaff({
          fullName: v.fullName,
          email: v.email,
          phone: v.phone,
          password: v.password,
          role: v.role,
          departmentId: v.departmentId ?? undefined,
          specialization: v.specialization || undefined,
          qualifications: v.qualifications || undefined,
          experienceYears: v.experienceYears,
          consultationFee: v.consultationFee,
          followUpFee: v.followUpFee,
          procedureFee: v.procedureFee,
          surgeryFee: v.surgeryFee,
          bio: v.bio || undefined,
        })
        .subscribe({
          next: (res) => this.modal.close(res),
          error: () => this.saving.set(false),
        });
    }
  }
}
