import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Department,
  DoctorDetail,
  DoctorListItem,
  DoctorSearchFilters,
  PagedResult,
  Slot,
} from '../../core/models';

export const DoctorsActions = createActionGroup({
  source: 'Doctors',
  events: {
    'Load Lookups': emptyProps(),
    'Load Lookups Success': props<{ departments: Department[]; specializations: string[] }>(),

    'Search': props<{ filters: DoctorSearchFilters }>(),
    'Search Success': props<{ result: PagedResult<DoctorListItem> }>(),
    'Search Failure': props<{ error: string }>(),

    'Load Doctor': props<{ id: number }>(),
    'Load Doctor Success': props<{ doctor: DoctorDetail }>(),
    'Load Doctor Failure': props<{ error: string }>(),

    'Load Slots': props<{ doctorId: number; from: string; to: string }>(),
    'Load Slots Success': props<{ slots: Slot[] }>(),
    'Load Slots Failure': props<{ error: string }>(),
  },
});
