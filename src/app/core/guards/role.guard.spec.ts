import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { roleGuard } from './role.guard';
import { User } from '../models';
import { selectAuthResolved, selectAuthUser } from '../../store/auth/auth.selectors';

function configure(user: User | null) {
  const store = {
    select: (selector: unknown) => {
      if (selector === selectAuthResolved) return of(true);
      if (selector === selectAuthUser) return of(user);
      return of(null);
    },
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: Store, useValue: store }],
  });
}

function run(roles: string[]): Promise<boolean | UrlTree> {
  const route = { data: { roles } } as unknown as ActivatedRouteSnapshot;
  const state = { url: '/x' } as RouterStateSnapshot;
  const injector = TestBed.inject(EnvironmentInjector);
  return firstValueFrom(
    runInInjectionContext(injector, () => roleGuard(route, state)) as Observable<boolean | UrlTree>,
  );
}

const patient: User = {
  id: 1, fullName: 'P', email: 'p@x.com', role: 'Patient', phone: '0300-0000000',
};

describe('roleGuard', () => {
  it('allows a user whose role is in the allowed list', async () => {
    configure(patient);
    expect(await run(['Patient'])).toBe(true);
  });

  it('redirects a user whose role is not allowed', async () => {
    configure(patient);
    const result = await run(['Doctor']);
    expect(result instanceof UrlTree).toBe(true);
    expect((TestBed.inject(Router).serializeUrl(result as UrlTree))).toBe('/patient/doctors');
  });

  it('redirects an anonymous user to login', async () => {
    configure(null);
    const result = await run(['Patient']);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/auth/login');
  });
});
