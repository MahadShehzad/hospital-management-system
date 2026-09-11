import { ChangeDetectionStrategy, Component, effect, inject, input, numberAttribute } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DoctorsActions } from '../../store/doctors/doctors.actions';
import {
  selectSelectedDoctor,
  selectSelectedDoctorLoading,
  selectSlots,
  selectSlotsLoading,
} from '../../store/doctors/doctors.selectors';
import { AppointmentsActions } from '../../store/appointments/appointments.actions';
import { selectBookError, selectBooking } from '../../store/appointments/appointments.selectors';
import { Slot } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { SlotPickerComponent, SlotRange } from '../../shared/components/slot-picker.component';
import { BookConfirmComponent } from './book-confirm.component';

@Component({
  selector: 'app-book-appointment',
  imports: [RouterLink, DecimalPipe, LoaderComponent, SlotPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-appointment.component.html',
})
export class BookAppointmentComponent {
  private readonly store = inject(Store);
  private readonly modal = inject(NgbModal);

  /** Bound from the route param `:id`. */
  readonly id = input.required({ transform: numberAttribute });

  readonly doctor = toSignal(this.store.select(selectSelectedDoctor));
  readonly doctorLoading = toSignal(this.store.select(selectSelectedDoctorLoading), {
    initialValue: false,
  });
  readonly slots = toSignal(this.store.select(selectSlots), { initialValue: [] as Slot[] });
  readonly slotsLoading = toSignal(this.store.select(selectSlotsLoading), { initialValue: false });
  readonly booking = toSignal(this.store.select(selectBooking), { initialValue: false });
  readonly bookError = toSignal(this.store.select(selectBookError));

  private currentRange: SlotRange | null = null;

  constructor() {
    effect(() => this.store.dispatch(DoctorsActions.loadDoctor({ id: this.id() })));

    // A conflict (409) means the slots are stale — refetch the same range.
    effect(() => {
      if (this.bookError() && this.currentRange) {
        this.store.dispatch(
          DoctorsActions.loadSlots({
            doctorId: this.id(),
            from: this.currentRange.from,
            to: this.currentRange.to,
          }),
        );
      }
    });
  }

  onRangeChanged(range: SlotRange) {
    this.currentRange = range;
    this.store.dispatch(
      DoctorsActions.loadSlots({ doctorId: this.id(), from: range.from, to: range.to }),
    );
  }

  async onSlotSelected(slot: Slot) {
    this.store.dispatch(AppointmentsActions.clearBookError());
    const ref = this.modal.open(BookConfirmComponent, { centered: true });
    const instance = ref.componentInstance as BookConfirmComponent;
    instance.slot = slot;
    instance.doctorName = this.doctor()?.fullName ?? 'this doctor';

    try {
      const reason = await ref.result;
      if (typeof reason === 'string') {
        this.store.dispatch(
          AppointmentsActions.book({ payload: { doctorId: this.id(), start: slot.start, reason } }),
        );
      }
    } catch {
      /* dismissed */
    }
  }
}
