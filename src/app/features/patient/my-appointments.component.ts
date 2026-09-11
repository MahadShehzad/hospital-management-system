import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge, timer } from 'rxjs';
import { filter } from 'rxjs';
import { NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AppointmentsActions } from '../../store/appointments/appointments.actions';
import {
  selectAppointmentsError,
  selectAppointmentsLoading,
  selectMutatingId,
  selectPastAppointments,
  selectUpcomingAppointments,
} from '../../store/appointments/appointments.selectors';
import { ACTIVE_STATUSES, Appointment } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmService } from '../../shared/components/confirm.service';
import { RescheduleModalComponent } from './reschedule-modal.component';

@Component({
  selector: 'app-my-appointments',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    NgbNavModule,
    NgTemplateOutlet,
    LoaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-appointments.component.html',
})
export class MyAppointmentsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly upcoming = toSignal(this.store.select(selectUpcomingAppointments), { initialValue: [] });
  readonly past = toSignal(this.store.select(selectPastAppointments), { initialValue: [] });
  readonly loading = toSignal(this.store.select(selectAppointmentsLoading), { initialValue: false });
  readonly error = toSignal(this.store.select(selectAppointmentsError));
  readonly mutatingId = toSignal(this.store.select(selectMutatingId));

  activeTab: 'upcoming' | 'past' = 'upcoming';

  ngOnInit() {
    this.store.dispatch(AppointmentsActions.load());

    // Poll every 20s for status changes, but only while the tab is visible.
    merge(timer(20000, 20000), fromEvent(document, 'visibilitychange'))
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.store.dispatch(AppointmentsActions.loadSilent()));
  }

  canModify(appt: Appointment): boolean {
    return ACTIVE_STATUSES.includes(appt.status) && new Date(appt.end) > new Date();
  }

  async cancel(appt: Appointment) {
    const ok = await this.confirm.ask({
      title: 'Cancel appointment?',
      message: `Cancel your ${appt.status.toLowerCase()} appointment with ${appt.doctorName}?`,
      confirmText: 'Yes, cancel',
      cancelText: 'Keep it',
      danger: true,
    });
    if (ok) {
      this.store.dispatch(AppointmentsActions.cancel({ id: appt.id, reason: 'Cancelled by patient' }));
    }
  }

  async reschedule(appt: Appointment) {
    const ref = this.modal.open(RescheduleModalComponent, { size: 'lg', centered: true, scrollable: true });
    const instance = ref.componentInstance as RescheduleModalComponent;
    instance.doctorId = appt.doctorId;
    instance.doctorName = appt.doctorName;
    try {
      const start = await ref.result;
      if (typeof start === 'string') {
        this.store.dispatch(AppointmentsActions.reschedule({ id: appt.id, start }));
      }
    } catch {
      /* dismissed */
    }
  }
}
