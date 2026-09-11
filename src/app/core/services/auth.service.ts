import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../models';

/**
 * Thin HTTP wrapper around the auth API plus the in-memory access token.
 * The refresh token lives only in an httpOnly cookie set by the server, so a
 * page reload recovers the session through {@link refresh}.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  /** Current access token, or null when logged out. Read by the auth interceptor. */
  readonly accessToken = signal<string | null>(null);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, payload)
      .pipe(tap((res) => this.accessToken.set(res.accessToken)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, payload)
      .pipe(tap((res) => this.accessToken.set(res.accessToken)));
  }

  /** Exchanges the refresh cookie for a fresh access token. */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/refresh`, {})
      .pipe(tap((res) => this.accessToken.set(res.accessToken)));
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.base}/logout`, {})
      .pipe(tap(() => this.accessToken.set(null)));
  }

  clearToken(): void {
    this.accessToken.set(null);
  }
}
