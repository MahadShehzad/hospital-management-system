import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
  {
    path: 'doctors',
    loadComponent: () => import('./doctor-search.component').then((m) => m.DoctorSearchComponent),
    title: 'Find a Doctor',
  },
  {
    path: 'book/:id',
    loadComponent: () => import('./book-appointment.component').then((m) => m.BookAppointmentComponent),
    title: 'Book Appointment',
  },
  {
    path: 'appointments',
    loadComponent: () => import('./my-appointments.component').then((m) => m.MyAppointmentsComponent),
    title: 'My Appointments',
  },
  {
    path: 'history',
    loadComponent: () => import('./medical-history.component').then((m) => m.MedicalHistoryComponent),
    title: 'Medical History',
  },
  {
    path: 'reports',
    loadComponent: () => import('./patient-reports.component').then((m) => m.PatientReportsComponent),
    title: 'My Reports',
  },
  {
    path: 'billing',
    loadComponent: () => import('./patient-billing.component').then((m) => m.PatientBillingComponent),
    title: 'Billing',
  },
  {
    path: 'profile',
    loadComponent: () => import('./patient-profile.component').then((m) => m.PatientProfileComponent),
    title: 'My Profile',
  },
  { path: '', pathMatch: 'full', redirectTo: 'doctors' },
];
