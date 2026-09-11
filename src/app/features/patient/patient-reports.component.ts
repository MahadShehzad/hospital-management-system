import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PatientReportService } from '../../core/services/clinical.service';
import { PatientReport } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import {
  ReportFiltersComponent,
  ReportFilterValue,
} from '../../shared/components/report-filters.component';

@Component({
  selector: 'app-patient-reports-view',
  imports: [DatePipe, LoaderComponent, EmptyStateComponent, ReportFiltersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-reports.component.html',
})
export class PatientReportsComponent {
  private readonly api = inject(PatientReportService);

  readonly reports = signal<PatientReport[]>([]);
  readonly loading = signal(true);
  readonly expanded = signal<number | null>(null);
  private filters: ReportFilterValue = { search: '', year: null, from: '', to: '' };

  constructor() {
    this.load();
  }

  onFilters(f: ReportFilterValue) {
    this.filters = f;
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api
      .search({
        search: this.filters.search || undefined,
        year: this.filters.year ?? undefined,
        from: this.filters.from || undefined,
        to: this.filters.to || undefined,
      })
      .subscribe({
        next: (list) => {
          this.reports.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggle(id: number) {
    this.expanded.update((v) => (v === id ? null : id));
  }
}
