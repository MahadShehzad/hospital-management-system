import { appointmentsFeature } from './appointments.reducer';
import { AppointmentsActions } from './appointments.actions';
import { Appointment } from '../../core/models';

const reducer = appointmentsFeature.reducer;

const appt = (over: Partial<Appointment> = {}): Appointment => ({
  id: 1,
  doctorId: 1,
  doctorName: 'Dr. Sara',
  specialization: 'Cardiology',
  patientId: 1,
  patientName: 'Ayesha',
  start: '2026-09-20T09:00:00',
  end: '2026-09-20T09:30:00',
  status: 'Pending',
  reason: 'Checkup',
  consultationFee: 3500,
  createdAt: '2026-09-10T00:00:00',
  ...over,
});

describe('appointments reducer', () => {
  it('loads the list', () => {
    const state = reducer(undefined, AppointmentsActions.loadSuccess({ appointments: [appt()] }));
    expect(state.items).toHaveLength(1);
    expect(state.loaded).toBe(true);
  });

  it('upserts on bookSuccess (adds when new)', () => {
    const state = reducer(undefined, AppointmentsActions.bookSuccess({ appointment: appt({ id: 5 }) }));
    expect(state.items.map((a) => a.id)).toEqual([5]);
    expect(state.booking).toBe(false);
  });

  it('replaces the matching appointment on mutationSuccess', () => {
    const loaded = reducer(undefined, AppointmentsActions.loadSuccess({ appointments: [appt({ id: 1, status: 'Pending' })] }));
    const updated = reducer(
      loaded,
      AppointmentsActions.mutationSuccess({ appointment: appt({ id: 1, status: 'Cancelled' }), message: 'x' }),
    );
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].status).toBe('Cancelled');
  });

  it('records a conflict error from bookFailure', () => {
    const state = reducer(undefined, AppointmentsActions.bookFailure({ error: 'That slot was just taken.', conflict: true }));
    expect(state.bookError).toBe('That slot was just taken.');
    expect(state.booking).toBe(false);
  });
});
