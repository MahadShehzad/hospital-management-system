import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminApiService } from '../../core/services/clinical.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { Department, Staff } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StaffFormComponent } from './staff-form.component';

@Component({
  selector: 'app-staff-management',
  imports: [LoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-management.component.html',
})
export class StaffManagementComponent {
  private readonly api = inject(AdminApiService);
  private readonly doctors = inject(DoctorService);
  private readonly modal = inject(NgbModal);
  private readonly notify = inject(NotificationService);

  readonly staff = signal<Staff[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    forkJoin({ staff: this.api.staff(), departments: this.doctors.getDepartments() }).subscribe({
      next: ({ staff, departments }) => {
        this.staff.set(staff);
        this.departments.set(departments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add() {
    const ref = this.modal.open(StaffFormComponent, { size: 'lg', centered: true, scrollable: true });
    (ref.componentInstance as StaffFormComponent).departments = this.departments();
    ref.result.then(
      (res: { staff: Staff; temporaryPassword?: string }) => {
        if (res.temporaryPassword) {
          this.notify.success(`${res.staff.fullName} created. Temp password: ${res.temporaryPassword}`);
        }
        this.load();
      },
      () => {},
    );
  }

  edit(s: Staff) {
    const ref = this.modal.open(StaffFormComponent, { size: 'lg', centered: true, scrollable: true });
    const inst = ref.componentInstance as StaffFormComponent;
    inst.departments = this.departments();
    inst.existing = s;
    ref.result.then(
      () => this.load(),
      () => {},
    );
  }

  toggleActive(s: Staff) {
    this.api.setStaffActive(s.userId, !s.isActive).subscribe({
      next: () => {
        this.notify.success(`${s.fullName} ${s.isActive ? 'deactivated' : 'activated'}.`);
        this.load();
      },
      error: () => this.notify.error('Could not update.'),
    });
  }
}
