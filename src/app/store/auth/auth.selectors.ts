import { createSelector } from '@ngrx/store';
import { authFeature } from './auth.reducer';

export const selectAuthUser = authFeature.selectUser;
export const selectAuthStatus = authFeature.selectStatus;
export const selectAuthError = authFeature.selectError;

export const selectIsAuthenticated = createSelector(
  authFeature.selectStatus,
  (status) => status === 'authenticated',
);

export const selectAuthResolved = createSelector(
  authFeature.selectStatus,
  (status) => status === 'authenticated' || status === 'anonymous',
);

export const selectUserRole = createSelector(selectAuthUser, (user) => user?.role ?? null);
