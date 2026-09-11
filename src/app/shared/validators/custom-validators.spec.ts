import { FormControl, FormGroup } from '@angular/forms';
import {
  ageRangeValidator,
  cnicValidator,
  matchFieldsValidator,
  notFutureDateValidator,
  passwordStrengthValidator,
  phoneValidator,
  timeRangeValidator,
} from './custom-validators';

describe('phoneValidator', () => {
  const v = phoneValidator();
  it('accepts local and international PK mobile formats', () => {
    expect(v(new FormControl('0301-1234567'))).toBeNull();
    expect(v(new FormControl('03011234567'))).toBeNull();
    expect(v(new FormControl('+923011234567'))).toBeNull();
  });
  it('rejects malformed numbers', () => {
    expect(v(new FormControl('12345'))).toEqual({ phone: true });
    expect(v(new FormControl('0400-1234567'))).toEqual({ phone: true });
  });
  it('ignores empty values (leave required to Validators.required)', () => {
    expect(v(new FormControl(''))).toBeNull();
  });
});

describe('cnicValidator', () => {
  const v = cnicValidator();
  it('accepts 00000-0000000-0', () => {
    expect(v(new FormControl('35202-1234567-1'))).toBeNull();
  });
  it('rejects missing dashes', () => {
    expect(v(new FormControl('3520212345671'))).toEqual({ cnic: true });
  });
});

describe('notFutureDateValidator', () => {
  const v = notFutureDateValidator();
  it('rejects a future date', () => {
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    expect(v(new FormControl(next.toISOString()))).toEqual({ futureDate: true });
  });
  it('accepts a past date', () => {
    expect(v(new FormControl('1990-01-01'))).toBeNull();
  });
});

describe('ageRangeValidator', () => {
  it('flags someone under the minimum age', () => {
    const v = ageRangeValidator(18);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 10);
    expect(v(new FormControl(dob.toISOString()))?.['minAge']).toBeTruthy();
  });
  it('passes an adult', () => {
    expect(ageRangeValidator(18)(new FormControl('1980-06-01'))).toBeNull();
  });
});

describe('passwordStrengthValidator', () => {
  const v = passwordStrengthValidator();
  it('reports each missing requirement', () => {
    expect(v(new FormControl('abc'))?.['passwordStrength']).toEqual({
      minlength: true,
      lowercase: false,
      uppercase: true,
      digit: true,
    });
  });
  it('passes a strong password', () => {
    expect(v(new FormControl('Passw0rd!'))).toBeNull();
  });
});

describe('group validators', () => {
  it('matchFieldsValidator flags mismatched values', () => {
    const group = new FormGroup(
      { a: new FormControl('one'), b: new FormControl('two') },
      { validators: matchFieldsValidator('a', 'b') },
    );
    expect(group.errors).toEqual({ fieldsMismatch: { a: 'a', b: 'b' } });
    group.get('b')!.setValue('one');
    expect(group.errors).toBeNull();
  });

  it('timeRangeValidator requires start before end', () => {
    const group = new FormGroup(
      { start: new FormControl('10:00'), end: new FormControl('09:00') },
      { validators: timeRangeValidator('start', 'end') },
    );
    expect(group.errors).toEqual({ timeRange: true });
  });
});
