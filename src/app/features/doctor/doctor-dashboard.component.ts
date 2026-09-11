import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/clinical.service';
import { DoctorDashboard } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-doctor-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    LoaderComponent,
    EmptyStateComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-dashboard.component.html',
})
export class DoctorDashboardComponent {
  private readonly api = inject(DashboardService);

  readonly data = signal<DoctorDashboard | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.api.doctor().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
