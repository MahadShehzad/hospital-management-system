import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideAppStore } from './store';
import { AuthActions } from './store/auth/auth.actions';
import { selectAuthResolved } from './store/auth/auth.selectors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    provideAppStore(),
    // Attempt a silent session restore before the first route resolves.
    provideAppInitializer(() => {
      const store = inject(Store);
      store.dispatch(AuthActions.bootstrap());
      return firstValueFrom(
        store.select(selectAuthResolved).pipe(
          filter((resolved) => resolved),
          take(1),
        ),
      );
    }),
  ],
};
