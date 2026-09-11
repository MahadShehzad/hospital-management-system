import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const PHONE_RE = /^(?:\+92|0)3\d{2}-?\d{7}$/;
const CNIC_RE = /^\d{5}-\d{7}-\d$/;

/** Pakistani mobile number: 03XX-XXXXXXX or +923XXXXXXXXX. */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) return null;
    return PHONE_RE.test(value) ? null : { phone: true };
  };
}

/** National ID: 00000-0000000-0. */
export function cnicValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) return null;
    return CNIC_RE.test(value) ? null : { cnic: true };
  };
}

/** Date must not be in the future (accepts Date or ISO string). */
export function notFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const date = new Date(control.value);
    if (Number.isNaN(date.getTime())) return { invalidDate: true };
    return date.getTime() > Date.now() ? { futureDate: true } : null;
  };
}

/** Person must be at least `min` years old (and not absurdly old). */
export function ageRangeValidator(min = 0, max = 120): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const dob = new Date(control.value);
    if (Number.isNaN(dob.getTime())) return { invalidDate: true };
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    if (age < min) return { minAge: { required: min, actual: age } };
    if (age > max) return { maxAge: { limit: max } };
    return null;
  };
}

/**
 * At least 8 chars with one lower, one upper and one digit.
 * Reports the individual failures under `passwordStrength`.
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString();
    if (!value) return null;
    const failures = {
      minlength: value.length < 8,
      lowercase: !/[a-z]/.test(value),
      uppercase: !/[A-Z]/.test(value),
      digit: !/\d/.test(value),
    };
    return Object.values(failures).some(Boolean) ? { passwordStrength: failures } : null;
  };
}

/** Group validator: two controls must hold the same value. */
export function matchFieldsValidator(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const first = group.get(a)?.value;
    const second = group.get(b)?.value;
    if (!first || !second) return null;
    return first === second ? null : { fieldsMismatch: { a, b } };
  };
}

/** Group validator: `start` must be strictly before `end` (HH:mm strings). */
export function timeRangeValidator(start: string, end: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const from = group.get(start)?.value;
    const to = group.get(end)?.value;
    if (!from || !to) return null;
    return from < to ? null : { timeRange: true };
  };
}
