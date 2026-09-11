import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-coming-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-cone-striped fs-1 text-primary"></i>
        <h1 class="h4 mt-3">{{ title() }}</h1>
        <p class="text-secondary mb-0">
          This area is part of a later delivery phase. The route, layout and role guard are in place.
        </p>
      </div>
    </div>
  `,
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['title'] as string) ?? 'Coming soon')),
    { initialValue: 'Coming soon' },
  );
}
