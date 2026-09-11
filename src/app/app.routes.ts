import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './shared/layout/shell.component';
import { LandingComponent } from './features/landing.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'patient',
        canActivate: [roleGuard],
        data: { roles: ['Patient'] },
        loadChildren: () =>
          import('./features/patient/patient.routes').then((m) => m.PATIENT_ROUTES),
      },
      {
        path: 'doctor',
        canActivate: [roleGuard],
        data: { roles: ['Doctor'] },
        loadChildren: () =>
          import('./features/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
      },
      {
        path: 'reception',
        canActivate: [roleGuard],
        data: { roles: ['Receptionist'] },
        loadChildren: () =>
          import('./features/reception/reception.routes').then((m) => m.RECEPTION_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      { path: '', pathMatch: 'full', component: LandingComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
