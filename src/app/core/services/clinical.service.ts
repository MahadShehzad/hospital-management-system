import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminReport,
  AvailabilityWindowFull,
  ClinicSettings,
  Department,
  DoctorDashboard,
  Holiday,
  Invoice,
  InvoiceLine,
  PatientProfile,
  PatientReport,
  PatientSummary,
  PayInvoicePayload,
  Prescription,
  QueueEntry,
  QueueStatus,
  ReceptionDashboard,
  SavePatientReportPayload,
  SavePrescriptionPayload,
  Staff,
  TimeOff,
} from '../models';

const api = environment.apiUrl;

export interface Me {
  userId: number;
  fullName: string;
  role: string;
  doctorId?: number | null;
  patientId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);
  private cached?: Me;

  get(force = false): Observable<Me> {
    if (this.cached && !force) return of(this.cached);
    return this.http.get<Me>(`${api}/me`).pipe(tap((m) => (this.cached = m)));
  }

  clear() {
    this.cached = undefined;
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  doctor(): Observable<DoctorDashboard> {
    return this.http.get<DoctorDashboard>(`${api}/dashboard/doctor`);
  }
  reception(): Observable<ReceptionDashboard> {
    return this.http.get<ReceptionDashboard>(`${api}/dashboard/reception`);
  }
}

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly http = inject(HttpClient);

  forAppointment(appointmentId: number): Observable<Prescription | null> {
    return this.http.get<Prescription | null>(`${api}/appointments/${appointmentId}/prescription`);
  }
  save(appointmentId: number, payload: SavePrescriptionPayload): Observable<Prescription> {
    return this.http.put<Prescription>(`${api}/appointments/${appointmentId}/prescription`, payload);
  }
  mine(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${api}/prescriptions/mine`);
  }
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${api}/me/availability`;

  list(): Observable<AvailabilityWindowFull[]> {
    return this.http.get<AvailabilityWindowFull[]>(this.base);
  }
  add(body: Partial<AvailabilityWindowFull>): Observable<AvailabilityWindowFull> {
    return this.http.post<AvailabilityWindowFull>(this.base, body);
  }
  update(id: number, body: Partial<AvailabilityWindowFull>): Observable<AvailabilityWindowFull> {
    return this.http.put<AvailabilityWindowFull>(`${this.base}/${id}`, body);
  }
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  timeOff(): Observable<TimeOff[]> {
    return this.http.get<TimeOff[]>(`${this.base}/time-off`);
  }
  saveTimeOff(body: { date: string; isOff: boolean; startTime?: string; endTime?: string }): Observable<TimeOff> {
    return this.http.put<TimeOff>(`${this.base}/time-off`, body);
  }
  removeTimeOff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/time-off/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class QueueService {
  private readonly http = inject(HttpClient);
  private readonly base = `${api}/queue`;

  today(doctorId?: number): Observable<QueueEntry[]> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId);
    return this.http.get<QueueEntry[]>(this.base, { params });
  }
  add(body: { doctorId: number; patientId: number; appointmentId?: number; notes?: string }): Observable<QueueEntry> {
    return this.http.post<QueueEntry>(this.base, body);
  }
  setStatus(id: number, status: QueueStatus): Observable<QueueEntry> {
    return this.http.patch<QueueEntry>(`${this.base}/${id}/status`, { status });
  }
  callNext(doctorId: number): Observable<QueueEntry | null> {
    return this.http.post<QueueEntry | null>(`${this.base}/call-next?doctorId=${doctorId}`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${api}/invoices`;

  list(filters: { status?: string; patientId?: number; from?: string; to?: string } = {}): Observable<Invoice[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<Invoice[]>(this.base, { params });
  }
  mine(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.base}/mine`);
  }
  get(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/${id}`);
  }
  create(body: {
    patientId: number;
    appointmentId?: number;
    discount: number;
    taxRate: number;
    notes?: string;
    items: InvoiceLine[];
  }): Observable<Invoice> {
    return this.http.post<Invoice>(this.base, body);
  }
  pay(id: number, payload: PayInvoicePayload): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.base}/${id}/pay`, payload);
  }
  void(id: number): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.base}/${id}/void`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class PatientReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${api}/reports`;

  search(filters: {
    patientId?: number;
    doctorId?: number;
    year?: number;
    from?: string;
    to?: string;
    search?: string;
  } = {}): Observable<PatientReport[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PatientReport[]>(this.base, { params });
  }
  create(body: SavePatientReportPayload): Observable<PatientReport> {
    return this.http.post<PatientReport>(this.base, body);
  }
  update(id: number, body: SavePatientReportPayload): Observable<PatientReport> {
    return this.http.put<PatientReport>(`${this.base}/${id}`, body);
  }
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PatientDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${api}/patients`;

  search(q: string): Observable<PatientSummary[]> {
    return this.http.get<PatientSummary[]>(this.base, { params: new HttpParams().set('q', q) });
  }
  list(): Observable<PatientSummary[]> {
    return this.http.get<PatientSummary[]>(this.base);
  }
  get(id: number): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.base}/${id}`);
  }
  me(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.base}/me`);
  }
  updateMe(body: Partial<PatientProfile>): Observable<PatientProfile> {
    return this.http.put<PatientProfile>(`${this.base}/me`, body);
  }
  registerWalkIn(body: Record<string, unknown>): Observable<{ patient: PatientProfile; temporaryPassword: string }> {
    return this.http.post<{ patient: PatientProfile; temporaryPassword: string }>(`${this.base}/walk-in`, body);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${api}/admin`;

  reports(): Observable<AdminReport> {
    return this.http.get<AdminReport>(`${this.base}/reports`);
  }
  staff(role?: string): Observable<Staff[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<Staff[]>(`${this.base}/staff`, { params });
  }
  createStaff(body: Record<string, unknown>): Observable<{ staff: Staff; temporaryPassword: string }> {
    return this.http.post<{ staff: Staff; temporaryPassword: string }>(`${this.base}/staff`, body);
  }
  updateStaff(userId: number, body: Record<string, unknown>): Observable<Staff> {
    return this.http.put<Staff>(`${this.base}/staff/${userId}`, body);
  }
  setStaffActive(userId: number, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.base}/staff/${userId}/active?active=${active}`, {});
  }
  createDepartment(body: { name: string; description?: string }): Observable<Department> {
    return this.http.post<Department>(`${this.base}/departments`, body);
  }
  updateDepartment(id: number, body: { name: string; description?: string }): Observable<Department> {
    return this.http.put<Department>(`${this.base}/departments/${id}`, body);
  }
  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/departments/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  get(): Observable<ClinicSettings> {
    return this.http.get<ClinicSettings>(`${api}/settings`);
  }
  update(body: ClinicSettings): Observable<ClinicSettings> {
    return this.http.put<ClinicSettings>(`${api}/settings`, body);
  }
  holidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${api}/holidays`);
  }
  addHoliday(body: { date: string; name: string }): Observable<Holiday> {
    return this.http.post<Holiday>(`${api}/holidays`, body);
  }
  removeHoliday(id: number): Observable<void> {
    return this.http.delete<void>(`${api}/holidays/${id}`);
  }
}
