import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminApiService } from '../../core/services/clinical.service';
import { AdminReport } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { BarChartComponent } from '../../shared/components/bar-chart.component';

@Component({
  selector: 'app-admin-overview',
  imports: [DecimalPipe, LoaderComponent, StatCardComponent, BarChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent {
  private readonly api = inject(AdminApiService);
  readonly report = signal<AdminReport | null>(null);
  readonly loading = signal(true);

  readonly trendData = computed(() =>
    (this.report()?.appointmentsTrend ?? []).map((t) => ({
      label: new Date(t.date).toLocaleDateString('en', { day: '2-digit', month: 'short' }),
      value: t.count,
    })),
  );
  readonly statusData = computed(() =>
    (this.report()?.appointmentsByStatus ?? []).map((s) => ({ label: s.status, value: s.count })),
  );
  readonly deptData = computed(() =>
    (this.report()?.patientsByDepartment ?? []).map((d) => ({ label: d.department, value: d.count })),
  );

  constructor() {
    this.api.reports().subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
