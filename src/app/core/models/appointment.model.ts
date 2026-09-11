export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

export interface Appointment {
  id: number;
  doctorId: number;
  doctorName: string;
  specialization: string;
  patientId: number;
  patientName: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  reason: string;
  cancelledReason?: string | null;
  consultationFee: number;
  createdAt: string;
}

export interface Slot {
  start: string;
  end: string;
}

export interface BookAppointmentPayload {
  doctorId: number;
  start: string;
  reason: string;
}

export const ACTIVE_STATUSES: AppointmentStatus[] = ['Pending', 'Confirmed'];
