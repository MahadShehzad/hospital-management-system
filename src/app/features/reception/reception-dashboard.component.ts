import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/clinical.service';
import { ReceptionDashboard } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-reception-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink, LoaderComponent, EmptyStateComponent, StatCardComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reception-dashboard.component.html',
})
export class ReceptionDashboardComponent {
  private readonly api = inject(DashboardService);
  readonly data = signal<ReceptionDashboard | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.api.reception().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
