import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { AppointmentsActions } from './appointments.actions';
import { AppointmentService } from '../../core/services/appointment.service';
import { NotificationService } from '../../core/services/notification.service';

const msg = (e: unknown, fallback: string) =>
  e instanceof HttpErrorResponse ? (e.error?.message ?? fallback) : fallback;

export const loadAppointmentsEffect = createEffect(
  (actions$ = inject(Actions), api = inject(AppointmentService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.load, AppointmentsActions.loadSilent),
      switchMap(() =>
        api.mine().pipe(
          map((appointments) => AppointmentsActions.loadSuccess({ appointments })),
          catchError((e) =>
            of(AppointmentsActions.loadFailure({ error: msg(e, 'Could not load appointments.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const bookEffect = createEffect(
  (actions$ = inject(Actions), api = inject(AppointmentService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.book),
      exhaustMap(({ payload }) =>
        api.book(payload).pipe(
          map((appointment) => AppointmentsActions.bookSuccess({ appointment })),
          catchError((e) => {
            const conflict = e instanceof HttpErrorResponse && e.status === 409;
            return of(
              AppointmentsActions.bookFailure({
                error: msg(e, 'Could not book the appointment.'),
                conflict,
              }),
            );
          }),
        ),
      ),
    ),
  { functional: true },
);

export const bookSuccessEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.bookSuccess),
      tap(() => {
        notify.success('Appointment requested. Check "My Appointments" for its status.');
        void router.navigateByUrl('/patient/appointments');
      }),
    ),
  { functional: true, dispatch: false },
);

export const rescheduleEffect = createEffect(
  (actions$ = inject(Actions), api = inject(AppointmentService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.reschedule),
      mergeMap(({ id, start }) =>
        api.reschedule(id, start).pipe(
          map((appointment) =>
            AppointmentsActions.mutationSuccess({ appointment, message: 'Appointment rescheduled.' }),
          ),
          catchError((e) =>
            of(AppointmentsActions.mutationFailure({ error: msg(e, 'Could not reschedule.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const cancelEffect = createEffect(
  (actions$ = inject(Actions), api = inject(AppointmentService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.cancel),
      mergeMap(({ id, reason }) =>
        api.cancel(id, reason).pipe(
          map((appointment) =>
            AppointmentsActions.mutationSuccess({ appointment, message: 'Appointment cancelled.' }),
          ),
          catchError((e) =>
            of(AppointmentsActions.mutationFailure({ error: msg(e, 'Could not cancel.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const changeStatusEffect = createEffect(
  (actions$ = inject(Actions), api = inject(AppointmentService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.changeStatus),
      mergeMap(({ id, status, note }) =>
        api.changeStatus(id, status, note).pipe(
          map((appointment) =>
            AppointmentsActions.mutationSuccess({ appointment, message: `Marked as ${status}.` }),
          ),
          catchError((e) =>
            of(AppointmentsActions.mutationFailure({ error: msg(e, 'Could not update status.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const mutationFeedbackEffect = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.mutationSuccess),
      tap(({ message }) => notify.success(message)),
    ),
  { functional: true, dispatch: false },
);

export const mutationErrorEffect = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AppointmentsActions.mutationFailure, AppointmentsActions.bookFailure),
      tap(({ error }) => notify.error(error)),
    ),
  { functional: true, dispatch: false },
);
