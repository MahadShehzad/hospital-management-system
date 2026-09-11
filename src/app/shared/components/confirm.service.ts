import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NgbModal);

  /** Resolves true when confirmed, false when dismissed/cancelled. */
  async ask(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.modal.open(ConfirmDialogComponent, { centered: true });
    (ref.componentInstance as ConfirmDialogComponent).data = data;
    try {
      return (await ref.result) === true;
    } catch {
      return false;
    }
  }
}
