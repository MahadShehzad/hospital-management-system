import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PatientReportService } from '../../core/services/clinical.service';
import { PatientReport, PatientSummary, ReportType } from '../../core/models';
import { PatientPickerComponent } from '../../shared/components/patient-picker.component';

const TYPES: ReportType[] = ['Lab', 'Radiology', 'Procedure', 'Discharge', 'Referral', 'Other'];

@Component({
  selector: 'app-report-form',
  imports: [ReactiveFormsModule, PatientPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-form.component.html',
})
export class ReportFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PatientReportService);
  readonly modal = inject(NgbActiveModal);

  /** When editing. */
  existing: PatientReport | null = null;
  /** Pre-selected patient (from patient profile context). */
  presetPatient: { patientId: number; fullName: string } | null = null;

  readonly types = TYPES;
  readonly saving = signal(false);
  readonly patient = signal<PatientSummary | { patientId: number; fullName: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    type: ['Lab' as ReportType, Validators.required],
    reportDate: [new Date().toISOString().slice(0, 10), Validators.required],
    summary: [''],
    findings: [''],
  });

  get isEdit() {
    return !!this.existing;
  }

  ngOnInit() {
    if (this.existing) {
      const r = this.existing;
      this.patient.set({ patientId: r.patientId, fullName: r.patientName });
      this.form.patchValue({
        title: r.title,
        type: r.type,
        reportDate: r.reportDate.slice(0, 10),
        summary: r.summary ?? '',
        findings: r.findings ?? '',
      });
    } else if (this.presetPatient) {
      this.patient.set(this.presetPatient);
    }
  }

  invalid(c: string) {
    const ctrl = this.form.get(c);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  submit() {
    const p = this.patient();
    if (!p) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      patientId: p.patientId,
      title: v.title.trim(),
      type: v.type,
      reportDate: v.reportDate,
      summary: v.summary || null,
      findings: v.findings || null,
    };
    this.saving.set(true);
    const op = this.existing
      ? this.api.update(this.existing.id, payload)
      : this.api.create(payload);
    op.subscribe({
      next: (report) => this.modal.close(report),
      error: () => this.saving.set(false),
    });
  }
}
