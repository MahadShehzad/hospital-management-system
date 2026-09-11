import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientDirectoryService } from '../../core/services/clinical.service';
import { PatientSummary } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-patient-list',
  imports: [RouterLink, ReactiveFormsModule, LoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent {
  private readonly dir = inject(PatientDirectoryService);

  readonly patients = signal<PatientSummary[]>([]);
  readonly loading = signal(true);
  readonly search = new FormControl('', { nonNullable: true });

  constructor() {
    this.load('');
    this.search.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((term) => this.load(term.trim()));
  }

  private load(term: string) {
    this.loading.set(true);
    const req = term ? this.dir.search(term) : this.dir.list();
    req.subscribe({
      next: (list) => {
        this.patients.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
