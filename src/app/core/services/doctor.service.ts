import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Department,
  DoctorDetail,
  DoctorListItem,
  DoctorSearchFilters,
  PagedResult,
  Slot,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  search(filters: DoctorSearchFilters): Observable<PagedResult<DoctorListItem>> {
    let params = new HttpParams();
    const add = (key: string, value: unknown) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    };
    add('search', filters.search);
    add('departmentId', filters.departmentId);
    add('specialization', filters.specialization);
    add('minRating', filters.minRating);
    add('availableOn', filters.availableOn);
    add('page', filters.page ?? 1);
    add('pageSize', filters.pageSize ?? 12);

    return this.http.get<PagedResult<DoctorListItem>>(`${this.base}/doctors`, { params });
  }

  getById(id: number): Observable<DoctorDetail> {
    return this.http.get<DoctorDetail>(`${this.base}/doctors/${id}`);
  }

  getSlots(doctorId: number, from: string, to: string): Observable<Slot[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Slot[]>(`${this.base}/doctors/${doctorId}/slots`, { params });
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/departments`);
  }

  getSpecializations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/specializations`);
  }
}
