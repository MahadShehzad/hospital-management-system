import { createSelector } from '@ngrx/store';
import { ACTIVE_STATUSES } from '../../core/models';
import { appointmentsFeature } from './appointments.reducer';

export const {
  selectItems: selectAppointments,
  selectLoading: selectAppointmentsLoading,
  selectLoaded: selectAppointmentsLoaded,
  selectError: selectAppointmentsError,
  selectBooking,
  selectBookError,
  selectMutatingId,
} = appointmentsFeature;

const byStartDesc = (a: { start: string }, b: { start: string }) => b.start.localeCompare(a.start);

export const selectUpcomingAppointments = createSelector(selectAppointments, (items) =>
  items
    .filter((a) => ACTIVE_STATUSES.includes(a.status) && new Date(a.end) >= new Date())
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start)),
);

export const selectPastAppointments = createSelector(selectAppointments, (items) =>
  items
    .filter((a) => !ACTIVE_STATUSES.includes(a.status) || new Date(a.end) < new Date())
    .slice()
    .sort(byStartDesc),
);
