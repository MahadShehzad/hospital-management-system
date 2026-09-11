import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./admin-overview.component').then((m) => m.AdminOverviewComponent),
    title: 'Clinic Overview',
  },
  {
    path: 'staff',
    loadComponent: () => import('./staff-management.component').then((m) => m.StaffManagementComponent),
    title: 'Staff',
  },
  {
    path: 'departments',
    loadComponent: () => import('./department-management.component').then((m) => m.DepartmentManagementComponent),
    title: 'Departments',
  },
  {
    path: 'settings',
    loadComponent: () => import('./clinic-settings.component').then((m) => m.ClinicSettingsComponent),
    title: 'Settings',
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
