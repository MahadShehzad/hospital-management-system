import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';
import { selectAuthResolved, selectIsAuthenticated } from '../../store/auth/auth.selectors';

/** Waits until the bootstrap refresh has resolved, then allows or redirects to login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([
    store.select(selectAuthResolved),
    store.select(selectIsAuthenticated),
  ]).pipe(
    filter(([resolved]) => resolved),
    take(1),
    map(([, authed]) =>
      authed
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};
