import { Pipe, PipeTransform } from '@angular/core';
import { AppointmentStatus } from '../../core/models';

const LABELS: Record<AppointmentStatus, string> = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  NoShow: 'No-show',
};

@Pipe({ name: 'appointmentStatus' })
export class AppointmentStatusPipe implements PipeTransform {
  transform(status: AppointmentStatus): string {
    return LABELS[status] ?? status;
  }
}
