import { createFeature, createReducer, on } from '@ngrx/store';
import { User } from '../../core/models';
import { AuthActions } from './auth.actions';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(AuthActions.login, AuthActions.register, (state) => ({
      ...state,
      status: 'loading' as const,
      error: null,
    })),
    on(AuthActions.authSuccess, (state, { response }) => ({
      ...state,
      user: response.user,
      status: 'authenticated' as const,
      error: null,
    })),
    on(AuthActions.authFailure, (state, { error }) => ({
      ...state,
      status: 'anonymous' as const,
      error,
    })),
    on(AuthActions.bootstrapSuccess, (state, { user }) => ({
      ...state,
      user,
      status: 'authenticated' as const,
    })),
    on(AuthActions.bootstrapFailure, AuthActions.logoutDone, AuthActions.sessionExpired, () => ({
      ...initialState,
      status: 'anonymous' as const,
    })),
  ),
});
