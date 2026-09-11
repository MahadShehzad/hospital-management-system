import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ROLE_HOME } from '../../core/models';

/**
 * Only trust the server's own message for an actual application error (4xx with a
 * body). A network failure or a dead/misconfigured backend must never be reported
 * as "invalid credentials" — that's misleading and sends people down the wrong path.
 */
const errorText = (err: unknown, fallback: string): string => {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) return 'Cannot reach the server. Make sure the API is running.';
  if (err.status >= 500) return 'The server hit an error. Please try again in a moment.';
  return err.error?.message ?? fallback;
};

export const loginEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ payload }) =>
        auth.login(payload).pipe(
          map((response) => AuthActions.authSuccess({ response, redirect: true })),
          catchError((error) =>
            of(AuthActions.authFailure({ error: errorText(error, 'Invalid email or password.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const registerEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ payload }) =>
        auth.register(payload).pipe(
          map((response) => AuthActions.authSuccess({ response, redirect: true })),
          catchError((error) =>
            of(AuthActions.authFailure({ error: errorText(error, 'Could not create the account.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const authSuccessRedirectEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AuthActions.authSuccess),
      tap(({ response, redirect }) => {
        if (redirect) {
          notify.success(`Welcome, ${response.user.fullName.split(' ')[0]}!`);
          void router.navigateByUrl(ROLE_HOME[response.user.role]);
        }
      }),
    ),
  { functional: true, dispatch: false },
);

export const authFailureEffect = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AuthActions.authFailure),
      tap(({ error }) => notify.error(error)),
    ),
  { functional: true, dispatch: false },
);

export const bootstrapEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.bootstrap),
      exhaustMap(() =>
        auth.refresh().pipe(
          map((response) => AuthActions.bootstrapSuccess({ user: response.user })),
          catchError(() => of(AuthActions.bootstrapFailure())),
        ),
      ),
    ),
  { functional: true },
);

export const logoutEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() => auth.logout().pipe(
        map(() => AuthActions.logoutDone()),
        catchError(() => of(AuthActions.logoutDone())),
      )),
    ),
  { functional: true },
);

export const afterLogoutEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.logoutDone, AuthActions.sessionExpired),
      tap(() => void router.navigateByUrl('/auth/login')),
    ),
  { functional: true, dispatch: false },
);

export const sessionExpiredEffect = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AuthActions.sessionExpired),
      tap(() => notify.info('Your session has expired. Please sign in again.')),
    ),
  { functional: true, dispatch: false },
);
