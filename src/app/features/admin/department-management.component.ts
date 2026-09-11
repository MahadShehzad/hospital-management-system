import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../core/services/clinical.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { Department } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';

@Component({
  selector: 'app-department-management',
  imports: [ReactiveFormsModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './department-management.component.html',
})
export class DepartmentManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly doctors = inject(DoctorService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly departments = signal<Department[]>([]);
  readonly loading = signal(true);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.doctors.getDepartments().subscribe({
      next: (list) => {
        this.departments.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startEdit(d: Department) {
    this.editingId.set(d.id);
    this.form.setValue({ name: d.name, description: d.description ?? '' });
  }

  cancel() {
    this.editingId.set(null);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = this.form.getRawValue();
    const id = this.editingId();
    const op = id ? this.api.updateDepartment(id, body) : this.api.createDepartment(body);
    op.subscribe({
      next: () => {
        this.notify.success(id ? 'Department updated.' : 'Department created.');
        this.cancel();
        this.load();
      },
      error: () => {},
    });
  }

  async remove(d: Department) {
    const ok = await this.confirm.ask({
      title: 'Delete department?',
      message: `"${d.name}" will be removed. Doctors must be reassigned first.`,
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.deleteDepartment(d.id).subscribe({
      next: () => {
        this.notify.success('Department deleted.');
        this.load();
      },
      error: () => {},
    });
  }
}
