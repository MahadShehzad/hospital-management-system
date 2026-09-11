import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card border-0 shadow-sm h-100">
      <div class="card-body d-flex align-items-center gap-3">
        <div
          class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style="width:46px;height:46px"
          [style.background]="tint()"
        >
          <i class="bi fs-4" [class]="icon()" [style.color]="color()"></i>
        </div>
        <div class="min-w-0">
          <div class="h4 mb-0 fw-semibold">{{ value() }}</div>
          <div class="small text-secondary text-truncate">{{ label() }}</div>
        </div>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input('bi-activity');
  readonly color = input('#32936f');

  tint() {
    return this.color() + '1f';
  }
}
