import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { PatientDirectoryService, PrescriptionService } from '../../core/services/clinical.service';
import { PdfService } from '../../core/services/pdf.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { Appointment, AppointmentStatus, PatientProfile, Prescription } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-appointment-detail',
  imports: [DatePipe, RouterLink, ReactiveFormsModule, LoaderComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-detail.component.html',
})
export class AppointmentDetailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly appts = inject(AppointmentService);
  private readonly rx = inject(PrescriptionService);
  private readonly patients = inject(PatientDirectoryService);
  private readonly pdf = inject(PdfService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly id = input.required({ transform: numberAttribute });

  readonly appointment = signal<Appointment | null>(null);
  readonly patient = signal<PatientProfile | null>(null);
  readonly prescription = signal<Prescription | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly busy = signal(false);

  readonly canPrescribe = computed(() => {
    const s = this.appointment()?.status;
    return s === 'Confirmed' || s === 'Completed';
  });

  readonly form = this.fb.nonNullable.group({
    diagnosis: '',
    notes: '',
    followUpDate: '',
    items: this.fb.array([this.newItem()]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  constructor() {
    effect(() => {
      this.id();
      this.load();
    });
  }

  private load() {
    this.loading.set(true);
    this.appts.get(this.id()).subscribe({
      next: (a) => {
        this.appointment.set(a);
        forkJoin({
          patient: this.patients.get(a.patientId),
          prescription: this.rx.forAppointment(a.id),
        }).subscribe({
          next: ({ patient, prescription }) => {
            this.patient.set(patient);
            if (prescription) this.hydrate(prescription);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private hydrate(p: Prescription) {
    this.prescription.set(p);
    this.items.clear();
    p.items.forEach((it) =>
      this.items.push(
        this.fb.nonNullable.group({
          medicineName: [it.medicineName, Validators.required],
          dosage: [it.dosage ?? ''],
          frequency: [it.frequency ?? ''],
          durationDays: [it.durationDays ?? null as number | null],
          instructions: [it.instructions ?? ''],
        }),
      ),
    );
    if (this.items.length === 0) this.items.push(this.newItem());
    this.form.patchValue({
      diagnosis: p.diagnosis ?? '',
      notes: p.notes ?? '',
      followUpDate: p.followUpDate ? p.followUpDate.slice(0, 10) : '',
    });
  }

  private newItem() {
    return this.fb.nonNullable.group({
      medicineName: ['', Validators.required],
      dosage: [''],
      frequency: [''],
      durationDays: [null as number | null],
      instructions: [''],
    });
  }

  addItem() {
    this.items.push(this.newItem());
  }
  removeItem(i: number) {
    this.items.removeAt(i);
    if (this.items.length === 0) this.addItem();
  }

  async setStatus(status: AppointmentStatus) {
    const ok = await this.confirm.ask({
      title: `Mark as ${status}?`,
      message: `Change this appointment to "${status}".`,
      confirmText: 'Yes',
    });
    if (!ok) return;
    this.busy.set(true);
    this.appts.changeStatus(this.id(), status).subscribe({
      next: (a) => {
        this.appointment.set(a);
        this.busy.set(false);
        this.notify.success(`Marked as ${status}.`);
      },
      error: () => this.busy.set(false),
    });
  }

  savePrescription() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.error('Every medicine needs a name.');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.rx
      .save(this.id(), {
        diagnosis: v.diagnosis || null,
        notes: v.notes || null,
        followUpDate: v.followUpDate || null,
        items: v.items.map((i) => ({
          medicineName: i.medicineName,
          dosage: i.dosage || null,
          frequency: i.frequency || null,
          durationDays: i.durationDays ?? null,
          instructions: i.instructions || null,
        })),
      })
      .subscribe({
        next: (p) => {
          this.prescription.set(p);
          this.saving.set(false);
          this.notify.success('Prescription saved.');
        },
        error: () => this.saving.set(false),
      });
  }

  downloadPdf() {
    const p = this.prescription();
    if (p) this.pdf.prescription(p);
  }
}
