import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { BillingService } from '../../core/services/clinical.service';
import { PdfService } from '../../core/services/pdf.service';
import { Invoice } from '../../core/models';
import { LoaderComponent } from '../../shared/components/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-patient-billing',
  imports: [DatePipe, DecimalPipe, LoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-billing.component.html',
})
export class PatientBillingComponent {
  private readonly billing = inject(BillingService);
  private readonly pdf = inject(PdfService);

  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.billing.mine().subscribe({
      next: (list) => {
        this.invoices.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  download(inv: Invoice) {
    this.billing.get(inv.id).subscribe((full) => this.pdf.invoice(full));
  }
}
