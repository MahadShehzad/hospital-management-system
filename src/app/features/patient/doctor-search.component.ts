import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { DoctorsActions } from '../../store/doctors/doctors.actions';
import {
  selectDepartments,
  selectDoctorResult,
  selectDoctorsError,
  selectDoctorsLoading,
} from '../../store/doctors/doctors.selectors';
import { DoctorSearchFilters } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

const toIsoDate = (d: NgbDateStruct | null): string | null =>
  d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : null;

@Component({
  selector: 'app-doctor-search',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    NgbDatepickerModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-search.component.html',
})
export class DoctorSearchComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly departments = toSignal(this.store.select(selectDepartments), { initialValue: [] });
  readonly result = toSignal(this.store.select(selectDoctorResult));
  readonly loading = toSignal(this.store.select(selectDoctorsLoading), { initialValue: false });
  readonly error = toSignal(this.store.select(selectDoctorsError));

  readonly today = ((): NgbDateStruct => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  })();

  readonly form = this.fb.nonNullable.group({
    search: '',
    departmentId: null as number | null,
    minRating: null as number | null,
    availableOn: null as NgbDateStruct | null,
  });

  private page = 1;

  ngOnInit() {
    this.store.dispatch(DoctorsActions.loadLookups());

    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        debounceTime(300),
        map(() => this.buildFilters()),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filters) => {
        this.page = 1;
        this.store.dispatch(DoctorsActions.search({ filters: { ...filters, page: 1 } }));
      });
  }

  private buildFilters(): DoctorSearchFilters {
    const v = this.form.getRawValue();
    return {
      search: v.search.trim() || null,
      departmentId: v.departmentId,
      minRating: v.minRating,
      availableOn: toIsoDate(v.availableOn),
      pageSize: 12,
    };
  }

  goToPage(page: number) {
    this.page = page;
    this.store.dispatch(DoctorsActions.search({ filters: { ...this.buildFilters(), page } }));
  }

  reset() {
    this.form.reset({ search: '', departmentId: null, minRating: null, availableOn: null });
  }

  pages(): number[] {
    const total = this.result()?.totalPages ?? 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get currentPage() {
    return this.page;
  }
}
