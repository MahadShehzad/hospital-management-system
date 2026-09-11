export interface Department {
  id: number;
  name: string;
  description?: string | null;
}

export interface FeeSchedule {
  consultation: number;
  followUp: number;
  procedure: number;
  surgery: number;
}

export interface DoctorListItem {
  id: number;
  fullName: string;
  specialization: string;
  departmentId: number;
  departmentName: string;
  experienceYears: number;
  consultationFee: number;
  fees: FeeSchedule;
  ratingAvg: number;
  ratingCount: number;
  bio?: string | null;
}

export interface AvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface DoctorDetail extends DoctorListItem {
  email: string;
  phone: string;
  qualifications?: string | null;
  availability: AvailabilityWindow[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface DoctorSearchFilters {
  search?: string | null;
  departmentId?: number | null;
  specialization?: string | null;
  minRating?: number | null;
  availableOn?: string | null;
  page?: number;
  pageSize?: number;
}
