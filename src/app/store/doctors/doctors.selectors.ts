import { doctorsFeature } from './doctors.reducer';

export const {
  selectDepartments,
  selectSpecializations,
  selectResult: selectDoctorResult,
  selectFilters: selectDoctorFilters,
  selectListLoading: selectDoctorsLoading,
  selectListError: selectDoctorsError,
  selectSelected: selectSelectedDoctor,
  selectSelectedLoading: selectSelectedDoctorLoading,
  selectSlots,
  selectSlotsLoading,
} = doctorsFeature;
