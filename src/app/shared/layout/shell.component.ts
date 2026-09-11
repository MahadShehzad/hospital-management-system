import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectAuthUser } from '../../store/auth/auth.selectors';
import { NAV_BY_ROLE } from './nav.config';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgbDropdownModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly store = inject(Store);

  readonly user = toSignal(this.store.select(selectAuthUser));
  readonly sidebarOpen = signal(false);

  navItems() {
    const role = this.user()?.role;
    return role ? NAV_BY_ROLE[role] : [];
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
