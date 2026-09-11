import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { ROLE_HOME } from '../core/models';
import { selectAuthUser } from '../store/auth/auth.selectors';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="py-5 text-center text-secondary">Redirecting…</div>`,
})
export class LandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  ngOnInit() {
    this.store
      .select(selectAuthUser)
      .pipe(take(1))
      .subscribe((user) => {
        void this.router.navigateByUrl(user ? ROLE_HOME[user.role] : '/auth/login');
      });
  }
}
