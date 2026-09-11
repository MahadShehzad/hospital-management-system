import { AppointmentStatusPipe } from './appointment-status.pipe';

describe('AppointmentStatusPipe', () => {
  const pipe = new AppointmentStatusPipe();

  it('humanises NoShow', () => {
    expect(pipe.transform('NoShow')).toBe('No-show');
  });

  it('passes other statuses through', () => {
    expect(pipe.transform('Pending')).toBe('Pending');
    expect(pipe.transform('Confirmed')).toBe('Confirmed');
    expect(pipe.transform('Completed')).toBe('Completed');
    expect(pipe.transform('Cancelled')).toBe('Cancelled');
  });
});
