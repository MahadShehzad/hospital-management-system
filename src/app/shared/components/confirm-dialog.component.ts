import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ data.title }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p class="mb-0">{{ data.message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss()">
        {{ data.cancelText ?? 'Cancel' }}
      </button>
      <button
        type="button"
        class="btn"
        [class.btn-danger]="data.danger"
        [class.btn-primary]="!data.danger"
        (click)="modal.close(true)"
      >
        {{ data.confirmText ?? 'Confirm' }}
      </button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly modal = inject(NgbActiveModal);
  data!: ConfirmDialogData;
}
