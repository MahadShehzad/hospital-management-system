import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Appointment, BookAppointmentPayload } from '../../core/models';

export const AppointmentsActions = createActionGroup({
  source: 'Appointments',
  events: {
    'Load': emptyProps(),
    'Load Silent': emptyProps(),
    'Load Success': props<{ appointments: Appointment[] }>(),
    'Load Failure': props<{ error: string }>(),

    'Book': props<{ payload: BookAppointmentPayload }>(),
    'Book Success': props<{ appointment: Appointment }>(),
    'Book Failure': props<{ error: string; conflict: boolean }>(),
    'Clear Book Error': emptyProps(),

    'Reschedule': props<{ id: number; start: string }>(),
    'Cancel': props<{ id: number; reason: string }>(),
    'Change Status': props<{ id: number; status: string; note?: string }>(),
    'Mutation Success': props<{ appointment: Appointment; message: string }>(),
    'Mutation Failure': props<{ error: string }>(),
  },
});
