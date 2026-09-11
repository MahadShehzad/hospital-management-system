import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./doctor-dashboard.component').then((m) => m.DoctorDashboardComponent),
    title: 'Doctor Dashboard',
  },
  {
    path: 'appointments',
    loadComponent: () => import('./doctor-appointments.component').then((m) => m.DoctorAppointmentsComponent),
    title: 'Appointments',
  },
  {
    path: 'appointments/:id',
    loadComponent: () => import('./appointment-detail.component').then((m) => m.AppointmentDetailComponent),
    title: 'Appointment',
  },
  {
    path: 'reports',
    loadComponent: () => import('./patient-reports.component').then((m) => m.DoctorPatientReportsComponent),
    title: 'Patient Reports',
  },
  {
    path: 'queue',
    loadComponent: () => import('./doctor-queue.component').then((m) => m.DoctorQueueComponent),
    title: 'Queue',
  },
  {
    path: 'availability',
    loadComponent: () => import('./availability-management.component').then((m) => m.AvailabilityManagementComponent),
    title: 'Availability',
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
