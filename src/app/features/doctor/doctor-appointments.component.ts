import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-doctor-appointments',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    NgbNavModule,
    LoaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-appointments.component.html',
})
export class DoctorAppointmentsComponent {
  private readonly api = inject(AppointmentService);

  readonly all = signal<Appointment[]>([]);
  readonly loading = signal(true);
  tab: 'today' | 'upcoming' | 'past' = 'today';

  private readonly startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  private readonly startOfTomorrow = new Date(this.startOfToday.getTime() + 86400000);

  readonly today = computed(() =>
    this.all()
      .filter((a) => new Date(a.start) >= this.startOfToday && new Date(a.start) < this.startOfTomorrow)
      .sort((a, b) => a.start.localeCompare(b.start)),
  );
  readonly upcoming = computed(() =>
    this.all()
      .filter((a) => new Date(a.start) >= this.startOfTomorrow)
      .sort((a, b) => a.start.localeCompare(b.start)),
  );
  readonly past = computed(() =>
    this.all()
      .filter((a) => new Date(a.start) < this.startOfToday)
      .sort((a, b) => b.start.localeCompare(a.start)),
  );

  constructor() {
    this.api.mine().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
