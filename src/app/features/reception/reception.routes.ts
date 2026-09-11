import { Routes } from '@angular/router';

export const RECEPTION_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./reception-dashboard.component').then((m) => m.ReceptionDashboardComponent),
    title: 'Front Desk',
  },
  {
    path: 'patients',
    loadComponent: () => import('./patient-list.component').then((m) => m.PatientListComponent),
    title: 'Patients',
  },
  {
    path: 'register',
    loadComponent: () => import('./patient-registration.component').then((m) => m.PatientRegistrationComponent),
    title: 'Register Patient',
  },
  {
    path: 'schedule',
    loadComponent: () => import('./appointment-scheduling.component').then((m) => m.AppointmentSchedulingComponent),
    title: 'Book Appointment',
  },
  {
    path: 'queue',
    loadComponent: () => import('./reception-queue.component').then((m) => m.ReceptionQueueComponent),
    title: 'Queue',
  },
  {
    path: 'billing',
    loadComponent: () => import('./billing.component').then((m) => m.BillingComponent),
    title: 'Billing',
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
