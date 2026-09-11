import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./login.component').then((m) => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import('./signup.component').then((m) => m.SignupComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];
