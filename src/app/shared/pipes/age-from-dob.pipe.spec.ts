import { AgeFromDobPipe } from './age-from-dob.pipe';

describe('AgeFromDobPipe', () => {
  const pipe = new AgeFromDobPipe();

  it('computes whole years from a date of birth', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 30);
    dob.setDate(dob.getDate() - 1); // ensure the birthday has passed
    expect(pipe.transform(dob)).toBe(30);
  });

  it('does not count an upcoming birthday', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 30);
    dob.setDate(dob.getDate() + 5); // birthday still ahead
    expect(pipe.transform(dob)).toBe(29);
  });

  it('returns null for empty or invalid input', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform('not-a-date')).toBeNull();
  });
});
