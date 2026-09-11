import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { PatientDirectoryService } from '../../core/services/clinical.service';
import { PatientSummary } from '../../core/models';

@Component({
  selector: 'app-patient-picker',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="position-relative">
      <input
        class="form-control"
        [formControl]="search"
        placeholder="Search patient by name or phone…"
        autocomplete="off"
      />
      @if (open() && results().length) {
        <div class="list-group position-absolute w-100 shadow-sm" style="z-index: 20; max-height: 240px; overflow:auto">
          @for (p of results(); track p.patientId) {
            <button type="button" class="list-group-item list-group-item-action" (click)="choose(p)">
              <span class="fw-semibold">{{ p.fullName }}</span>
              <span class="small text-secondary ms-2">{{ p.phone }}</span>
              @if (p.age != null) { <span class="small text-secondary ms-1">· {{ p.age }}y</span> }
            </button>
          }
        </div>
      }
    </div>
    @if (selected()) {
      <div class="form-text text-success">
        <i class="bi bi-check-circle me-1"></i>Selected: {{ selected()!.fullName }} ({{ selected()!.phone }})
      </div>
    }
  `,
})
export class PatientPickerComponent {
  private readonly dir = inject(PatientDirectoryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly results = signal<PatientSummary[]>([]);
  readonly open = signal(false);
  readonly selected = signal<PatientSummary | null>(null);

  readonly picked = output<PatientSummary | null>();

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((t) => {
          if (t.trim().length < 2) {
            this.results.set([]);
            this.open.set(false);
            return false;
          }
          return true;
        }),
        switchMap((t) => this.dir.search(t.trim())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.results.set(list);
        this.open.set(true);
      });
  }

  choose(p: PatientSummary) {
    this.selected.set(p);
    this.search.setValue(p.fullName, { emitEvent: false });
    this.open.set(false);
    this.picked.emit(p);
  }

  reset() {
    this.selected.set(null);
    this.search.setValue('', { emitEvent: false });
    this.results.set([]);
    this.picked.emit(null);
  }
}
