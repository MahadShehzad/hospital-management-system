import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { authFeature } from './auth/auth.reducer';
import { doctorsFeature } from './doctors/doctors.reducer';
import { appointmentsFeature } from './appointments/appointments.reducer';

import * as authEffects from './auth/auth.effects';
import * as doctorsEffects from './doctors/doctors.effects';
import * as appointmentsEffects from './appointments/appointments.effects';

export function provideAppStore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideStore(),
    provideState(authFeature),
    provideState(doctorsFeature),
    provideState(appointmentsFeature),
    provideEffects(authEffects, doctorsEffects, appointmentsEffects),
    provideRouterStore(),
    provideStoreDevtools({ maxAge: 25, connectInZone: false }),
  ]);
}
