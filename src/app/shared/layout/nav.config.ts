import { UserRole } from '../../core/models';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  Patient: [
    { label: 'Find a Doctor', icon: 'bi-search-heart', path: '/patient/doctors' },
    { label: 'My Appointments', icon: 'bi-calendar2-check', path: '/patient/appointments' },
    { label: 'Medical History', icon: 'bi-file-medical', path: '/patient/history' },
    { label: 'My Reports', icon: 'bi-folder2-open', path: '/patient/reports' },
    { label: 'Billing', icon: 'bi-receipt', path: '/patient/billing' },
    { label: 'My Profile', icon: 'bi-person-vcard', path: '/patient/profile' },
  ],
  Doctor: [
    { label: 'Dashboard', icon: 'bi-speedometer2', path: '/doctor/dashboard' },
    { label: 'Appointments', icon: 'bi-calendar-week', path: '/doctor/appointments' },
    { label: 'Patient Reports', icon: 'bi-folder2-open', path: '/doctor/reports' },
    { label: 'Queue', icon: 'bi-people', path: '/doctor/queue' },
    { label: 'Availability', icon: 'bi-clock-history', path: '/doctor/availability' },
  ],
  Receptionist: [
    { label: 'Front Desk', icon: 'bi-clipboard2-pulse', path: '/reception/dashboard' },
    { label: 'Patients', icon: 'bi-people', path: '/reception/patients' },
    { label: 'Register Patient', icon: 'bi-person-plus', path: '/reception/register' },
    { label: 'Book Appointment', icon: 'bi-calendar-plus', path: '/reception/schedule' },
    { label: 'Queue', icon: 'bi-hourglass-split', path: '/reception/queue' },
    { label: 'Billing', icon: 'bi-cash-stack', path: '/reception/billing' },
  ],
  Admin: [
    { label: 'Overview', icon: 'bi-graph-up-arrow', path: '/admin/dashboard' },
    { label: 'Staff', icon: 'bi-person-badge', path: '/admin/staff' },
    { label: 'Departments', icon: 'bi-diagram-3', path: '/admin/departments' },
    { label: 'Settings', icon: 'bi-gear', path: '/admin/settings' },
  ],
};
