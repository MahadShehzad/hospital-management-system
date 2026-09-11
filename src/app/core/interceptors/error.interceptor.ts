import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

const SILENT = ['/auth/refresh', '/auth/me', '/auth/login', '/auth/register'];

// Endpoints whose 4xx is handled inline by the calling component (don't double-toast).
const HANDLES_OWN_4XX = [
  { urlIncludes: '/appointments', status: 409 }, // booking / reschedule conflict
];

/** Surfaces server/network errors as toasts, using the API's own message when present. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !SILENT.some((s) => req.url.includes(s))) {
        const handledInline = HANDLES_OWN_4XX.some(
          (h) => req.url.includes(h.urlIncludes) && error.status === h.status,
        );
        const serverMessage = (error.error as { message?: string } | null)?.message;

        if (!handledInline) {
          if (error.status === 0) {
            notify.error('Cannot reach the server. Check your connection.');
          } else if (error.status >= 500) {
            notify.error(serverMessage ?? 'Something went wrong on the server.');
          } else if (error.status === 403) {
            notify.error(serverMessage ?? 'You do not have permission to do that.');
          } else if ([400, 404, 409, 422].includes(error.status)) {
            notify.error(serverMessage ?? 'That action could not be completed.');
          }
        }
      }
      return throwError(() => error);
    }),
  );
};
