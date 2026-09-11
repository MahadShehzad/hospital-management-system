import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center text-secondary py-5">
      <i class="bi fs-1" [class]="icon()"></i>
      <p class="h6 mt-3 mb-1 text-body">{{ title() }}</p>
      @if (message()) {
        <p class="small mb-0">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('bi-inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
