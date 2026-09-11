import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center text-secondary py-5">
      <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
      @if (label()) {
        <p class="mt-3 mb-0 small">{{ label() }}</p>
      }
    </div>
  `,
})
export class LoaderComponent {
  readonly label = input<string>('Loading…');
}
