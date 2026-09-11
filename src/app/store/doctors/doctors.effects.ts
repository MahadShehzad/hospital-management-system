import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { DoctorsActions } from './doctors.actions';
import { DoctorService } from '../../core/services/doctor.service';

const msg = (e: unknown, fallback: string) =>
  e instanceof HttpErrorResponse ? (e.error?.message ?? fallback) : fallback;

export const loadLookupsEffect = createEffect(
  (actions$ = inject(Actions), doctors = inject(DoctorService)) =>
    actions$.pipe(
      ofType(DoctorsActions.loadLookups),
      switchMap(() =>
        forkJoin({
          departments: doctors.getDepartments(),
          specializations: doctors.getSpecializations(),
        }).pipe(
          map(({ departments, specializations }) =>
            DoctorsActions.loadLookupsSuccess({ departments, specializations }),
          ),
          catchError(() =>
            of(DoctorsActions.loadLookupsSuccess({ departments: [], specializations: [] })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const searchEffect = createEffect(
  (actions$ = inject(Actions), doctors = inject(DoctorService)) =>
    actions$.pipe(
      ofType(DoctorsActions.search),
      switchMap(({ filters }) =>
        doctors.search(filters).pipe(
          map((result) => DoctorsActions.searchSuccess({ result })),
          catchError((e) =>
            of(DoctorsActions.searchFailure({ error: msg(e, 'Could not load doctors.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadDoctorEffect = createEffect(
  (actions$ = inject(Actions), doctors = inject(DoctorService)) =>
    actions$.pipe(
      ofType(DoctorsActions.loadDoctor),
      switchMap(({ id }) =>
        doctors.getById(id).pipe(
          map((doctor) => DoctorsActions.loadDoctorSuccess({ doctor })),
          catchError((e) =>
            of(DoctorsActions.loadDoctorFailure({ error: msg(e, 'Could not load the doctor.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadSlotsEffect = createEffect(
  (actions$ = inject(Actions), doctors = inject(DoctorService)) =>
    actions$.pipe(
      ofType(DoctorsActions.loadSlots),
      switchMap(({ doctorId, from, to }) =>
        doctors.getSlots(doctorId, from, to).pipe(
          map((slots) => DoctorsActions.loadSlotsSuccess({ slots })),
          catchError((e) =>
            of(DoctorsActions.loadSlotsFailure({ error: msg(e, 'Could not load slots.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);
