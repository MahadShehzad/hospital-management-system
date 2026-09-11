import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';

/** Shared in-flight refresh so parallel 401s trigger a single refresh call. */
let refreshInFlight: Observable<string> | null = null;

const isAuthEndpoint = (url: string) =>
  url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const store = inject(Store);

  const withToken = (token: string | null) =>
    token && !isAuthEndpoint(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(withToken(auth.accessToken())).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthEndpoint(req.url)
      ) {
        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = auth.refresh().pipe(
          switchMap((res) => [res.accessToken]),
          catchError((refreshError) => {
            auth.clearToken();
            store.dispatch(AuthActions.sessionExpired());
            return throwError(() => refreshError);
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
        // Reset once settled so a later 401 can refresh again.
        refreshInFlight.subscribe({
          error: () => (refreshInFlight = null),
          complete: () => (refreshInFlight = null),
        });
      }

      return refreshInFlight.pipe(switchMap((token) => next(withToken(token))));
    }),
  );
};
