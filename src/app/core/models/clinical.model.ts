import { Appointment } from './appointment.model';

// ---- Prescriptions ----
export interface PrescriptionItem {
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  durationDays?: number | null;
  instructions?: string | null;
}

export interface Prescription {
  id: number;
  appointmentId: number;
  doctorName: string;
  doctorSpecialization: string;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  appointmentDate: string;
  diagnosis?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  createdAt: string;
  items: PrescriptionItem[];
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
}

export interface SavePrescriptionPayload {
  diagnosis?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  items: PrescriptionItem[];
}

// ---- Availability ----
export interface AvailabilityWindowFull {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface TimeOff {
  id: number;
  date: string;
  isOff: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

// ---- Queue ----
export type QueueStatus = 'Waiting' | 'Called' | 'InRoom' | 'Done' | 'Skipped';

export interface QueueEntry {
  id: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  tokenNumber: number;
  status: QueueStatus;
  date: string;
  createdAt: string;
  calledAt?: string | null;
  notes?: string | null;
}

// ---- Billing ----
export type InvoiceStatus = 'Unpaid' | 'Paid' | 'Void';
export type PaymentMethod = 'Cash' | 'Card' | 'BankTransfer' | 'JazzCash' | 'EasyPaisa';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'Cash', label: 'Cash', icon: 'bi-cash' },
  { value: 'Card', label: 'Credit / Debit Card', icon: 'bi-credit-card' },
  { value: 'BankTransfer', label: 'Bank Transfer', icon: 'bi-bank' },
  { value: 'JazzCash', label: 'JazzCash', icon: 'bi-phone' },
  { value: 'EasyPaisa', label: 'EasyPaisa', icon: 'bi-phone' },
];

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceItemView extends InvoiceLine {
  id: number;
  amount: number;
}

export interface PaymentDetail {
  id: number;
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
  cardHolder?: string | null;
  cardLast4?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  mobileNumber?: string | null;
  paidAt: string;
}

export interface PayInvoicePayload {
  method: PaymentMethod;
  reference?: string;
  cardHolder?: string;
  cardLast4?: string;
  bankName?: string;
  accountName?: string;
  mobileNumber?: string;
}

export interface Invoice {
  id: number;
  number: string;
  patientId: number;
  patientName: string;
  appointmentId?: number | null;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod | null;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  paidAt?: string | null;
  notes?: string | null;
  items: InvoiceItemView[];
  payments: PaymentDetail[];
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
}

export type ReportType = 'Lab' | 'Radiology' | 'Procedure' | 'Discharge' | 'Referral' | 'Other';

export interface PatientReport {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentId?: number | null;
  title: string;
  type: ReportType;
  reportDate: string;
  summary?: string | null;
  findings?: string | null;
  createdAt: string;
}

export interface SavePatientReportPayload {
  patientId: number;
  appointmentId?: number | null;
  title: string;
  type: ReportType;
  reportDate: string;
  summary?: string | null;
  findings?: string | null;
}

// ---- Patient profile ----
export interface PatientProfile {
  patientId: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  dob?: string | null;
  age?: number | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
}

export interface PatientSummary {
  patientId: number;
  fullName: string;
  phone: string;
  age?: number | null;
  gender?: string | null;
}

// ---- Settings ----
export interface ClinicSettings {
  clinicName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  openTime: string;
  closeTime: string;
  bookingLeadHours: number;
  bookingWindowDays: number;
  defaultTaxRate: number;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
}

// ---- Staff / departments ----
export interface Staff {
  userId: number;
  doctorId?: number | null;
  fullName: string;
  email: string;
  phone: string;
  role: 'Doctor' | 'Receptionist' | 'Admin';
  isActive: boolean;
  specialization?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  experienceYears?: number | null;
  consultationFee?: number | null;
  followUpFee?: number | null;
  procedureFee?: number | null;
  surgeryFee?: number | null;
  createdAt: string;
}

// ---- Dashboards / reports ----
export interface DoctorDashboard {
  doctorName: string;
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  upcomingTotal: number;
  waitingInQueue: number;
  today: Appointment[];
  upcoming: Appointment[];
}

export interface ReceptionDashboard {
  todayAppointments: number;
  todayCheckedIn: number;
  waitingInQueue: number;
  unpaidInvoices: number;
  todayRevenue: number;
  todaySchedule: Appointment[];
}

export interface AdminReport {
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
  appointmentsThisMonth: number;
  appointmentsToday: number;
  revenueThisMonth: number;
  revenueToday: number;
  unpaidInvoices: number;
  appointmentsByStatus: { status: string; count: number }[];
  doctorPerformance: {
    doctorId: number;
    doctorName: string;
    specialization: string;
    totalAppointments: number;
    completed: number;
    noShow: number;
    cancelled: number;
    ratingAvg: number;
    revenue: number;
  }[];
  appointmentsTrend: { date: string; count: number }[];
  patientsByDepartment: { department: string; count: number }[];
}
