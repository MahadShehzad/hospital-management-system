import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { MeService, QueueService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { QueueEntry, QueueStatus } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-doctor-queue',
  imports: [DatePipe, LoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-queue.component.html',
})
export class DoctorQueueComponent {
  private readonly queue = inject(QueueService);
  private readonly me = inject(MeService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly entries = signal<QueueEntry[]>([]);
  readonly loading = signal(true);
  private doctorId: number | null = null;

  constructor() {
    this.me.get().subscribe((m) => (this.doctorId = m.doctorId ?? null));
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

  current() {
    return this.entries().find((e) => e.status === 'Called' || e.status === 'InRoom') ?? null;
  }
  waiting() {
    return this.entries().filter((e) => e.status === 'Waiting');
  }
  done() {
    return this.entries().filter((e) => e.status === 'Done' || e.status === 'Skipped');
  }

  set(entry: QueueEntry, status: QueueStatus) {
    this.queue.setStatus(entry.id, status).subscribe({
      next: () => this.refresh(true),
      error: () => this.notify.error('Could not update the queue.'),
    });
  }

  callNext() {
    if (!this.doctorId) return;
    this.queue.callNext(this.doctorId).subscribe({
      next: (next) => {
        this.refresh(true);
        this.notify.success(next ? `Now calling token #${next.tokenNumber}` : 'Queue is empty.');
      },
      error: () => this.notify.error('Could not call the next patient.'),
    });
  }
}
