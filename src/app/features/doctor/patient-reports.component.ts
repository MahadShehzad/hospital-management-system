import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PatientReportService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { PatientReport } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import {
  ReportFiltersComponent,
  ReportFilterValue,
} from '../../shared/components/report-filters.component';
import { ReportFormComponent } from './report-form.component';

@Component({
  selector: 'app-patient-reports',
  imports: [DatePipe, LoaderComponent, EmptyStateComponent, ReportFiltersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-reports.component.html',
})
export class DoctorPatientReportsComponent {
  private readonly api = inject(PatientReportService);
  private readonly modal = inject(NgbModal);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

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

  add() {
    const ref = this.modal.open(ReportFormComponent, { size: 'lg', centered: true, scrollable: true });
    ref.result.then(
      () => {
        this.notify.success('Report saved.');
        this.load();
      },
      () => {},
    );
  }

  edit(r: PatientReport) {
    const ref = this.modal.open(ReportFormComponent, { size: 'lg', centered: true, scrollable: true });
    (ref.componentInstance as ReportFormComponent).existing = r;
    ref.result.then(
      () => {
        this.notify.success('Report updated.');
        this.load();
      },
      () => {},
    );
  }

  async remove(r: PatientReport) {
    const ok = await this.confirm.ask({
      title: 'Delete report?',
      message: `"${r.title}" for ${r.patientName}`,
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.remove(r.id).subscribe({
      next: () => this.load(),
      error: () => {},
    });
  }
}
