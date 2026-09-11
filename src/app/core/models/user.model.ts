export type UserRole = 'Patient' | 'Doctor' | 'Receptionist' | 'Admin';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** Landing route for each role after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  Patient: '/patient/doctors',
  Doctor: '/doctor/dashboard',
  Receptionist: '/reception/dashboard',
  Admin: '/admin/dashboard',
};
