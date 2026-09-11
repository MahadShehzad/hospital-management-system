import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-vh-100 d-flex flex-column flex-lg-row">
      <div
        class="app-brand-gradient text-white p-4 p-lg-5 d-flex flex-column justify-content-center col-lg-5"
      >
        <div class="mx-auto" style="max-width: 420px">
          <h1 class="h3 fw-bold d-flex align-items-center gap-2">
            <i class="bi bi-hospital"></i> MediCare Clinic
          </h1>
          <p class="lead fs-6 opacity-75 mt-3 mb-0">
            Book appointments with the right specialist, manage your visits, and keep every
            prescription in one place.
          </p>
        </div>
      </div>
      <div class="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-4">
        <div class="w-100" style="max-width: 460px">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
