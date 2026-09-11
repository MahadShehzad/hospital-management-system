import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface BarDatum {
  label: string;
  value: number;
}

/** Minimal dependency-free horizontal bar chart. */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vstack gap-2">
      @for (row of rows(); track row.label) {
        <div class="d-flex align-items-center gap-2 small">
          <span class="text-secondary text-truncate" style="width:130px">{{ row.label }}</span>
          <div class="flex-grow-1 bg-light rounded-pill" style="height:16px">
            <div
              class="rounded-pill h-100"
              [style.width.%]="row.pct"
              [style.background]="color()"
              [style.min-width.px]="row.value ? 4 : 0"
            ></div>
          </div>
          <span class="fw-semibold" style="width:52px; text-align:right">{{ row.value | number }}</span>
        </div>
      }
    </div>
  `,
  imports: [DecimalPipe],
})
export class BarChartComponent {
  readonly data = input.required<BarDatum[]>();
  readonly color = input('#32936f');

  readonly rows = computed(() => {
    const max = Math.max(1, ...this.data().map((d) => d.value));
    return this.data().map((d) => ({ ...d, pct: (d.value / max) * 100 }));
  });
}
