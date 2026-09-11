import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectAuthStatus } from '../../store/auth/auth.selectors';
import {
  matchFieldsValidator,
  passwordStrengthValidator,
  phoneValidator,
} from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly status = toSignal(this.store.select(selectAuthStatus));
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator()]],
      password: ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchFieldsValidator('password', 'confirmPassword') },
  );

  get passwordErrors() {
    return this.form.get('password')?.errors?.['passwordStrength'] as
      | Record<string, boolean>
      | undefined;
  }

  invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get mismatch(): boolean {
    const c = this.form.get('confirmPassword');
    return this.form.hasError('fieldsMismatch') && !!c && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, email, phone, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({ payload: { fullName, email, phone, password } }));
  }
}
