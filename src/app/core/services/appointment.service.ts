import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, BookAppointmentPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/appointments`;

  mine(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/mine`);
  }

  get(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.base}/${id}`);
  }

  book(payload: BookAppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, payload);
  }

  bookFor(patientId: number, payload: BookAppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/for/${patientId}`, payload);
  }

  reschedule(id: number, start: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/reschedule`, { start });
  }

  cancel(id: number, reason: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/cancel`, { reason });
  }

  changeStatus(id: number, status: string, note?: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/status`, { status, note });
  }
}
