import { createFeature, createReducer, on } from '@ngrx/store';
import {
  Department,
  DoctorDetail,
  DoctorListItem,
  DoctorSearchFilters,
  PagedResult,
  Slot,
} from '../../core/models';
import { DoctorsActions } from './doctors.actions';

export interface DoctorsState {
  departments: Department[];
  specializations: string[];
  result: PagedResult<DoctorListItem> | null;
  filters: DoctorSearchFilters;
  listLoading: boolean;
  listError: string | null;
  selected: DoctorDetail | null;
  selectedLoading: boolean;
  slots: Slot[];
  slotsLoading: boolean;
}

const initialState: DoctorsState = {
  departments: [],
  specializations: [],
  result: null,
  filters: { page: 1, pageSize: 12 },
  listLoading: false,
  listError: null,
  selected: null,
  selectedLoading: false,
  slots: [],
  slotsLoading: false,
};

export const doctorsFeature = createFeature({
  name: 'doctors',
  reducer: createReducer(
    initialState,
    on(DoctorsActions.loadLookupsSuccess, (state, { departments, specializations }) => ({
      ...state,
      departments,
      specializations,
    })),

    on(DoctorsActions.search, (state, { filters }) => ({
      ...state,
      filters,
      listLoading: true,
      listError: null,
    })),
    on(DoctorsActions.searchSuccess, (state, { result }) => ({
      ...state,
      result,
      listLoading: false,
    })),
    on(DoctorsActions.searchFailure, (state, { error }) => ({
      ...state,
      listLoading: false,
      listError: error,
    })),

    on(DoctorsActions.loadDoctor, (state) => ({
      ...state,
      selected: null,
      selectedLoading: true,
      slots: [],
    })),
    on(DoctorsActions.loadDoctorSuccess, (state, { doctor }) => ({
      ...state,
      selected: doctor,
      selectedLoading: false,
    })),
    on(DoctorsActions.loadDoctorFailure, (state) => ({
      ...state,
      selectedLoading: false,
    })),

    on(DoctorsActions.loadSlots, (state) => ({ ...state, slotsLoading: true })),
    on(DoctorsActions.loadSlotsSuccess, (state, { slots }) => ({
      ...state,
      slots,
      slotsLoading: false,
    })),
    on(DoctorsActions.loadSlotsFailure, (state) => ({
      ...state,
      slots: [],
      slotsLoading: false,
    })),
  ),
});
