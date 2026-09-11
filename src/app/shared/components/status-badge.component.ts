import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AppointmentStatus } from '../../core/models';
import { AppointmentStatusPipe } from '../pipes/appointment-status.pipe';

const MODIFIER: Record<AppointmentStatus, string> = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Cancelled: 'cancelled',
  NoShow: 'noshow',
};

@Component({
  selector: 'app-status-badge',
  imports: [AppointmentStatusPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge rounded-pill status-badge" [class]="'status-badge--' + modifier()">
      {{ status() | appointmentStatus }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<AppointmentStatus>();
  readonly modifier = computed(() => MODIFIER[this.status()]);
}
