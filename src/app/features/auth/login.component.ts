import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectAuthStatus } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <h2 class="h4 mb-1">Welcome back</h2>
        <p class="text-secondary small mb-4">Sign in to manage your appointments.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="mb-3">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              autocomplete="email"
              [class.is-invalid]="invalid('email')"
            />
            <div class="invalid-feedback">Enter a valid email address.</div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <div class="input-group has-validation">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control border-end-0"
                formControlName="password"
                autocomplete="current-password"
                [class.is-invalid]="invalid('password')"
              />
              <button
                type="button"
                class="btn btn-outline-secondary border-start-0"
                [class.is-invalid]="invalid('password')"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                (click)="showPassword.set(!showPassword())"
              >
                <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
              </button>
              <div class="invalid-feedback">Password is required.</div>
            </div>
          </div>

          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="rememberMe"
              formControlName="rememberMe"
            />
            <label class="form-check-label small" for="rememberMe">
              Keep me signed in on this device
            </label>
          </div>

          <button
            class="btn btn-primary w-100"
            type="submit"
            [disabled]="status() === 'loading'"
          >
            @if (status() === 'loading') {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            Sign in
          </button>
        </form>

        <p class="text-center small text-secondary mt-4 mb-0">
          New here? <a routerLink="/auth/signup">Create a patient account</a>
        </p>

        <div class="alert alert-light border small mt-4 mb-0">
          <strong>Demo logins</strong> (password <code>Passw0rd!</code>):<br />
          ayesha&#64;patient.test · sara&#64;doctor.test · reception&#64;hospital.test · admin&#64;hospital.test
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly status = toSignal(this.store.select(selectAuthStatus));
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.dispatch(AuthActions.login({ payload: this.form.getRawValue() }));
  }
}
