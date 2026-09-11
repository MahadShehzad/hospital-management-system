import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { NotificationService } from '../../core/services/notification.service';
import { Appointment, DoctorListItem, PatientSummary, Slot } from '../../core/models';
import { PatientPickerComponent } from '../../shared/components/patient-picker.component';
import { SlotPickerComponent, SlotRange } from '../../shared/components/slot-picker.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-appointment-scheduling',
  imports: [DatePipe, ReactiveFormsModule, PatientPickerComponent, SlotPickerComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-scheduling.component.html',
})
export class AppointmentSchedulingComponent {
  private readonly doctors = inject(DoctorService);
  private readonly appts = inject(AppointmentService);
  private readonly notify = inject(NotificationService);

  readonly doctorList = signal<DoctorListItem[]>([]);
  readonly slots = signal<Slot[]>([]);
  readonly slotsLoading = signal(false);
  readonly booking = signal(false);
  readonly booked = signal<Appointment[]>([]);

  readonly patient = signal<PatientSummary | null>(null);
  readonly doctorId = new FormControl<number | null>(null);
  readonly reason = new FormControl('', { nonNullable: true });

  private range: SlotRange | null = null;

  constructor() {
    this.doctors.search({ pageSize: 50 }).subscribe((r) => this.doctorList.set(r.items));
    this.doctorId.valueChanges.subscribe(() => this.slots.set([]));
    this.loadBooked();
  }

  private loadBooked() {
    this.appts.mine().subscribe((list) =>
      this.booked.set(
        list
          .filter((a) => (a.status === 'Pending' || a.status === 'Confirmed') && new Date(a.end) >= new Date())
          .sort((a, b) => a.start.localeCompare(b.start)),
      ),
    );
  }

  loadRange(range: SlotRange) {
    const id = this.doctorId.value;
    if (!id) return;
    this.range = range;
    this.slotsLoading.set(true);
    this.doctors.getSlots(id, range.from, range.to).subscribe({
      next: (s) => {
        this.slots.set(s);
        this.slotsLoading.set(false);
      },
      error: () => this.slotsLoading.set(false),
    });
  }

  book(slot: Slot) {
    const p = this.patient();
    const id = this.doctorId.value;
    if (!p) return this.notify.error('Pick a patient first.');
    if (!id) return this.notify.error('Pick a doctor first.');
    if (this.reason.value.trim().length < 3) return this.notify.error('Enter a reason for the visit.');

    this.booking.set(true);
    this.appts
      .bookFor(p.patientId, { doctorId: id, start: slot.start, reason: this.reason.value.trim() })
      .subscribe({
        next: () => {
          this.booking.set(false);
          this.notify.success(`Appointment booked for ${p.fullName}.`);
          this.loadBooked();
          this.patient.set(null);
          this.reason.reset();
          if (this.range) this.loadRange(this.range);
        },
        error: (e) => {
          this.booking.set(false);
          if (e?.status === 409 && this.range) this.loadRange(this.range);
        },
      });
  }
}
