import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { PrescriptionService } from '../../core/services/clinical.service';
import { PdfService } from '../../core/services/pdf.service';
import { Appointment, Prescription } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import {
  ReportFiltersComponent,
  ReportFilterValue,
} from '../../shared/components/report-filters.component';

@Component({
  selector: 'app-medical-history',
  imports: [DatePipe, LoaderComponent, EmptyStateComponent, StatusBadgeComponent, ReportFiltersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './medical-history.component.html',
})
export class MedicalHistoryComponent {
  private readonly appts = inject(AppointmentService);
  private readonly rx = inject(PrescriptionService);
  private readonly pdf = inject(PdfService);

  readonly loading = signal(true);
  private readonly appointments = signal<Appointment[]>([]);
  private readonly prescriptions = signal<Prescription[]>([]);
  readonly filters = signal<ReportFilterValue>({ search: '', year: null, from: '', to: '' });

  readonly visits = computed(() => {
    const rxByAppt = new Map(this.prescriptions().map((p) => [p.appointmentId, p]));
    const f = this.filters();
    const term = f.search.trim().toLowerCase();
    const fromT = f.from ? new Date(f.from).getTime() : null;
    const toT = f.to ? new Date(f.to).getTime() + 86_400_000 : null;

    return this.appointments()
      .filter((a) => a.status === 'Completed' || a.status === 'NoShow' || new Date(a.end) < new Date())
      .filter((a) => {
        if (term && !`${a.doctorName} ${a.specialization} ${a.reason}`.toLowerCase().includes(term)) return false;
        const t = new Date(a.start).getTime();
        if (f.year && new Date(a.start).getFullYear() !== f.year) return false;
        if (fromT && t < fromT) return false;
        if (toT && t >= toT) return false;
        return true;
      })
      .sort((a, b) => b.start.localeCompare(a.start))
      .map((a) => ({ appt: a, prescription: rxByAppt.get(a.id) ?? null }));
  });

  constructor() {
    forkJoin({ appts: this.appts.mine(), rx: this.rx.mine() }).subscribe({
      next: ({ appts, rx }) => {
        this.appointments.set(appts);
        this.prescriptions.set(rx);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  download(p: Prescription) {
    this.pdf.prescription(p);
  }
}
