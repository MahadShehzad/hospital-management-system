import { authFeature, AuthState } from './auth.reducer';
import { AuthActions } from './auth.actions';
import { AuthResponse, User } from '../../core/models';

const reducer = authFeature.reducer;

const user: User = {
  id: 1,
  fullName: 'Ayesha Khan',
  email: 'ayesha@patient.test',
  role: 'Patient',
  phone: '0301-1111111',
};

const response: AuthResponse = {
  accessToken: 'token',
  expiresAtUtc: new Date().toISOString(),
  user,
};

const initial: AuthState = { user: null, status: 'idle', error: null };

describe('auth reducer', () => {
  it('goes to loading on login', () => {
    const state = reducer(initial, AuthActions.login({ payload: { email: 'a', password: 'b' } }));
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores the user on auth success', () => {
    const state = reducer(initial, AuthActions.authSuccess({ response, redirect: true }));
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(user);
  });

  it('records the error and becomes anonymous on failure', () => {
    const state = reducer(initial, AuthActions.authFailure({ error: 'Invalid email or password.' }));
    expect(state.status).toBe('anonymous');
    expect(state.error).toBe('Invalid email or password.');
  });

  it('clears the session on logout, session-expiry and bootstrap failure', () => {
    const authed: AuthState = { user, status: 'authenticated', error: null };
    for (const action of [
      AuthActions.logoutDone(),
      AuthActions.sessionExpired(),
      AuthActions.bootstrapFailure(),
    ]) {
      const state = reducer(authed, action);
      expect(state.user).toBeNull();
      expect(state.status).toBe('anonymous');
    }
  });

  it('marks resolved on bootstrap success without a redirect', () => {
    const state = reducer(initial, AuthActions.bootstrapSuccess({ user }));
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(user);
  });
});
