import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DoctorService } from '../../core/services/doctor.service';
import { Slot } from '../../core/models';
import { SlotPickerComponent, SlotRange } from '../../shared/components/slot-picker.component';

@Component({
  selector: 'app-reschedule-modal',
  imports: [SlotPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Reschedule with {{ doctorName }}</h5>
      <button type="button" class="btn-close" (click)="modal.dismiss()" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <p class="small text-secondary">
        Your current time stays booked until you confirm a new one.
      </p>
      <app-slot-picker
        [slots]="slots()"
        [loading]="loading()"
        (slotSelected)="modal.close($event.start)"
        (rangeChanged)="loadRange($event)"
      />
    </div>
  `,
})
export class RescheduleModalComponent implements OnInit {
  private readonly doctors = inject(DoctorService);
  readonly modal = inject(NgbActiveModal);

  doctorId!: number;
  doctorName = '';

  readonly slots = signal<Slot[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    /* slot-picker emits the initial range */
  }

  loadRange(range: SlotRange) {
    this.loading.set(true);
    this.doctors.getSlots(this.doctorId, range.from, range.to).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
