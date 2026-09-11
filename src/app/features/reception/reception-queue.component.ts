import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { DoctorService } from '../../core/services/doctor.service';
import { QueueService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { DoctorListItem, PatientSummary, QueueEntry, QueueStatus } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PatientPickerComponent } from '../../shared/components/patient-picker.component';

@Component({
  selector: 'app-reception-queue',
  imports: [ReactiveFormsModule, LoaderComponent, EmptyStateComponent, PatientPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reception-queue.component.html',
})
export class ReceptionQueueComponent {
  private readonly doctors = inject(DoctorService);
  private readonly queue = inject(QueueService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly doctorList = signal<DoctorListItem[]>([]);
  readonly entries = signal<QueueEntry[]>([]);
  readonly loading = signal(true);

  readonly doctorId = new FormControl<number | null>(null);
  readonly patient = signal<PatientSummary | null>(null);
  readonly adding = signal(false);

  readonly byDoctor = computed(() => {
    const groups = new Map<number, { name: string; entries: QueueEntry[] }>();
    for (const e of this.entries()) {
      const g = groups.get(e.doctorId) ?? { name: e.doctorName, entries: [] };
      g.entries.push(e);
      groups.set(e.doctorId, g);
    }
    return [...groups.entries()].map(([id, g]) => ({ id, ...g }));
  });

  constructor() {
    this.doctors.search({ pageSize: 50 }).subscribe((r) => this.doctorList.set(r.items));
    this.refresh();
    timer(15000, 15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh(true));
  }

  private refresh(silent = false) {
    if (!silent) this.loading.set(true);
    this.queue.today().subscribe({
      next: (list) => {
        this.entries.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add() {
    const p = this.patient();
    const id = this.doctorId.value;
    if (!p || !id) {
      this.notify.error('Pick a patient and a doctor.');
      return;
    }
    this.adding.set(true);
    this.queue.add({ doctorId: id, patientId: p.patientId }).subscribe({
      next: (e) => {
        this.adding.set(false);
        this.notify.success(`Added — token #${e.tokenNumber}`);
        this.refresh(true);
      },
      error: (err) => {
        this.adding.set(false);
        if (err?.status === 400) this.notify.error(err.error?.message ?? 'Already in queue.');
      },
    });
  }

  set(e: QueueEntry, status: QueueStatus) {
    this.queue.setStatus(e.id, status).subscribe({
      next: () => this.refresh(true),
      error: () => this.notify.error('Could not update.'),
    });
  }

  callNext(doctorId: number) {
    this.queue.callNext(doctorId).subscribe({
      next: () => this.refresh(true),
      error: () => this.notify.error('Could not call next.'),
    });
  }
}
