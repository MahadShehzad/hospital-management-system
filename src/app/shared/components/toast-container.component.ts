import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1090">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="toast show align-items-center text-bg-{{ toast.kind }} border-0 mb-2"
          role="alert"
        >
          <div class="d-flex">
            <div class="toast-body">{{ toast.text }}</div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              (click)="notify.dismiss(toast.id)"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly notify = inject(NotificationService);
}
