import { createFeature, createReducer, on } from '@ngrx/store';
import { Appointment } from '../../core/models';
import { AppointmentsActions } from './appointments.actions';

export interface AppointmentsState {
  items: Appointment[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  booking: boolean;
  bookError: string | null;
  mutatingId: number | null;
}

const initialState: AppointmentsState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
  booking: false,
  bookError: null,
  mutatingId: null,
};

const upsert = (items: Appointment[], updated: Appointment): Appointment[] => {
  const idx = items.findIndex((a) => a.id === updated.id);
  if (idx === -1) return [updated, ...items];
  const copy = [...items];
  copy[idx] = updated;
  return copy;
};

export const appointmentsFeature = createFeature({
  name: 'appointments',
  reducer: createReducer(
    initialState,
    on(AppointmentsActions.load, (state) => ({ ...state, loading: true, error: null })),
    on(AppointmentsActions.loadSuccess, (state, { appointments }) => ({
      ...state,
      items: appointments,
      loading: false,
      loaded: true,
    })),
    on(AppointmentsActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(AppointmentsActions.book, (state) => ({ ...state, booking: true, bookError: null })),
    on(AppointmentsActions.bookSuccess, (state, { appointment }) => ({
      ...state,
      booking: false,
      items: upsert(state.items, appointment),
    })),
    on(AppointmentsActions.bookFailure, (state, { error }) => ({
      ...state,
      booking: false,
      bookError: error,
    })),
    on(AppointmentsActions.clearBookError, (state) => ({ ...state, bookError: null })),

    on(
      AppointmentsActions.reschedule,
      AppointmentsActions.cancel,
      AppointmentsActions.changeStatus,
      (state, { id }) => ({ ...state, mutatingId: id }),
    ),
    on(AppointmentsActions.mutationSuccess, (state, { appointment }) => ({
      ...state,
      mutatingId: null,
      items: upsert(state.items, appointment),
    })),
    on(AppointmentsActions.mutationFailure, (state) => ({ ...state, mutatingId: null })),
  ),
});
