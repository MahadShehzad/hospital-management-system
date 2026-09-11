import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SettingsService } from '../../core/services/clinical.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { ClinicSettings, Holiday } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';

@Component({
  selector: 'app-clinic-settings',
  imports: [DatePipe, ReactiveFormsModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clinic-settings.component.html',
})
export class ClinicSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SettingsService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly holidays = signal<Holiday[]>([]);

  readonly form = this.fb.nonNullable.group({
    clinicName: ['', Validators.required],
    address: [''],
    phone: [''],
    email: [''],
    openTime: ['09:00', Validators.required],
    closeTime: ['21:00', Validators.required],
    bookingLeadHours: [1, [Validators.min(0), Validators.max(168)]],
    bookingWindowDays: [14, [Validators.min(1), Validators.max(90)]],
    defaultTaxRate: [0, [Validators.min(0), Validators.max(100)]],
  });

  readonly holidayForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    name: ['', Validators.required],
  });

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    forkJoin({ settings: this.api.get(), holidays: this.api.holidays() }).subscribe({
      next: ({ settings, holidays }) => {
        this.form.patchValue({
          clinicName: settings.clinicName,
          address: settings.address ?? '',
          phone: settings.phone ?? '',
          email: settings.email ?? '',
          openTime: settings.openTime.slice(0, 5),
          closeTime: settings.closeTime.slice(0, 5),
          bookingLeadHours: settings.bookingLeadHours,
          bookingWindowDays: settings.bookingWindowDays,
          defaultTaxRate: settings.defaultTaxRate,
        });
        this.holidays.set(holidays);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.update(this.form.getRawValue() as ClinicSettings).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Settings saved.');
      },
      error: () => this.saving.set(false),
    });
  }

  addHoliday() {
    if (this.holidayForm.invalid) return;
    this.api.addHoliday(this.holidayForm.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Holiday added.');
        this.holidayForm.reset({ date: '', name: '' });
        this.api.holidays().subscribe((h) => this.holidays.set(h));
      },
      error: () => {},
    });
  }

  async removeHoliday(h: Holiday) {
    const ok = await this.confirm.ask({ title: 'Remove holiday?', message: h.name, danger: true, confirmText: 'Remove' });
    if (!ok) return;
    this.api.removeHoliday(h.id).subscribe({
      next: () => this.api.holidays().subscribe((list) => this.holidays.set(list)),
      error: () => {},
    });
  }
}
