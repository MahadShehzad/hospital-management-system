import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../../core/models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ payload: LoginPayload }>(),
    'Register': props<{ payload: RegisterPayload }>(),
    'Auth Success': props<{ response: AuthResponse; redirect: boolean }>(),
    'Auth Failure': props<{ error: string }>(),

    'Bootstrap': emptyProps(),
    'Bootstrap Success': props<{ user: User }>(),
    'Bootstrap Failure': emptyProps(),

    'Logout': emptyProps(),
    'Logout Done': emptyProps(),
    'Session Expired': emptyProps(),
  },
});
