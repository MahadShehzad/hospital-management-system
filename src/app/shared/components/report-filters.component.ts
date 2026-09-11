import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface ReportFilterValue {
  search: string;
  year: number | null;
  from: string;
  to: string;
}

@Component({
  selector: 'app-report-filters',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="row g-2 align-items-end">
      <div class="col-12 col-md-4">
        <label class="form-label small text-secondary">{{ searchLabel }}</label>
        <input class="form-control" formControlName="search" placeholder="Type to filter…" />
      </div>
      <div class="col-6 col-md-2">
        <label class="form-label small text-secondary">Year</label>
        <select class="form-select" formControlName="year">
          <option [ngValue]="null">Any</option>
          @for (y of years; track y) { <option [ngValue]="y">{{ y }}</option> }
        </select>
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label small text-secondary">From</label>
        <input type="date" class="form-control" formControlName="from" />
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label small text-secondary">To</label>
        <input type="date" class="form-control" formControlName="to" />
      </div>
    </form>
  `,
})
export class ReportFiltersComponent {
  private readonly fb = inject(FormBuilder);
  searchLabel = 'Search';
  readonly changed = output<ReportFilterValue>();

  readonly years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  readonly form = this.fb.nonNullable.group({
    search: '',
    year: null as number | null,
    from: '',
    to: '',
  });

  constructor() {
    this.form.valueChanges.pipe(debounceTime(250), takeUntilDestroyed()).subscribe(() => {
      this.changed.emit(this.form.getRawValue());
    });
  }
}
