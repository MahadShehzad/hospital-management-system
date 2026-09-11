import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AvailabilityService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { AvailabilityWindowFull, TimeOff } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { timeRangeValidator } from '../../shared/validators/custom-validators';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-availability-management',
  imports: [DatePipe, ReactiveFormsModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './availability-management.component.html',
})
export class AvailabilityManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AvailabilityService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly days = DAYS;
  readonly windows = signal<AvailabilityWindowFull[]>([]);
  readonly timeOff = signal<TimeOff[]>([]);
  readonly loading = signal(true);
  readonly savingWindow = signal(false);

  readonly grouped = computed(() =>
    DAYS.map((name, day) => ({
      day,
      name,
      windows: this.windows()
        .filter((w) => w.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })),
  );

  readonly windowForm = this.fb.nonNullable.group(
    {
      dayOfWeek: [6, Validators.required],
      startTime: ['10:00', Validators.required],
      endTime: ['13:00', Validators.required],
      slotDurationMinutes: [30, [Validators.required, Validators.min(5), Validators.max(120)]],
    },
    { validators: timeRangeValidator('startTime', 'endTime') },
  );

  readonly timeOffForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
  });

  constructor() {
    this.reload();
  }

  private reload() {
    this.loading.set(true);
    forkJoin({ windows: this.api.list(), timeOff: this.api.timeOff() }).subscribe({
      next: ({ windows, timeOff }) => {
        this.windows.set(windows);
        this.timeOff.set(timeOff);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addWindow() {
    if (this.windowForm.invalid) {
      this.windowForm.markAllAsTouched();
      return;
    }
    this.savingWindow.set(true);
    this.api.add(this.windowForm.getRawValue()).subscribe({
      next: () => {
        this.savingWindow.set(false);
        this.notify.success('Availability added.');
        this.reload();
      },
      error: () => this.savingWindow.set(false),
    });
  }

  toggleActive(w: AvailabilityWindowFull) {
    this.api.update(w.id, { ...w, isActive: !w.isActive }).subscribe({
      next: () => this.reload(),
      error: () => this.notify.error('Could not update.'),
    });
  }

  async removeWindow(w: AvailabilityWindowFull) {
    const ok = await this.confirm.ask({
      title: 'Remove window?',
      message: `${this.days[w.dayOfWeek]} ${w.startTime}–${w.endTime}`,
      danger: true,
      confirmText: 'Remove',
    });
    if (!ok) return;
    this.api.remove(w.id).subscribe({
      next: () => this.reload(),
      error: () => this.notify.error('Could not remove.'),
    });
  }

  addTimeOff() {
    if (this.timeOffForm.invalid) return;
    this.api.saveTimeOff({ date: this.timeOffForm.getRawValue().date, isOff: true }).subscribe({
      next: () => {
        this.notify.success('Day off added.');
        this.timeOffForm.reset({ date: '' });
        this.reload();
      },
      error: () => this.notify.error('Could not add day off.'),
    });
  }

  removeTimeOff(t: TimeOff) {
    this.api.removeTimeOff(t.id).subscribe({
      next: () => this.reload(),
      error: () => this.notify.error('Could not remove.'),
    });
  }
}
