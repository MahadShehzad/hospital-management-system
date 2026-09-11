import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';
import { ROLE_HOME, UserRole } from '../models';
import { selectAuthResolved, selectAuthUser } from '../../store/auth/auth.selectors';

/**
 * Guards a route by role. Put the allowed roles on the route:
 * `{ path: '...', canActivate: [authGuard, roleGuard], data: { roles: ['Doctor'] } }`
 */
export const roleGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);
  const allowed = (route.data['roles'] ?? []) as UserRole[];

  return combineLatest([
    store.select(selectAuthResolved),
    store.select(selectAuthUser),
  ]).pipe(
    filter(([resolved]) => resolved),
    take(1),
    map(([, user]) => {
      if (!user) {
        return router.createUrlTree(['/auth/login']);
      }
      if (allowed.length === 0 || allowed.includes(user.role)) {
        return true;
      }
      return router.createUrlTree([ROLE_HOME[user.role]]);
    }),
  );
};
