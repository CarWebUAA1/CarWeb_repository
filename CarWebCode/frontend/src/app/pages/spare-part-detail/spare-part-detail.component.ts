import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import type {
  CreateStockMovement,
  StockMovementReason,
  StockMovementType,
} from '../../models/spare-part.model';
import { AuthService } from '../../services/auth.service';
import { SparePartService } from '../../services/spare-part.service';

@Component({
  selector: 'app-spare-part-detail',
  imports: [SiteHeaderComponent, RouterLink, CurrencyPipe],
  templateUrl: './spare-part-detail.component.html',
  styleUrl: './spare-part-detail.component.css',
})
export class SparePartDetailComponent {
  private readonly sparePartService = inject(SparePartService);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly part = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.sparePartService.getSparePart(params),
  });

  protected readonly canRecordMovement = computed(
    () => !!this.auth.token() && this.auth.isEmployee(),
  );
  protected readonly showMovementForm = signal(false);
  protected readonly loading = signal(false);
  protected readonly movementType = linkedSignal({
    source: () => this.part.value()?.inventoryStatus,
    computation: (status) => status === 'Out of stock' ? 'In' : 'Out',
  });
  protected readonly reason = signal<StockMovementReason>('Spare parts');
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error' | ''>('');

  protected readonly movementReasons: StockMovementReason[] = [
    'Purchase',
    'Sale',
    'Transfer',
    'Return',
    'Spare parts',
  ];

  toggleMovementForm(): void {
    this.showMovementForm.update((shown) => !shown);
    this.message.set('');
    this.messageType.set('');
  }

  setMovementType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'In' || value === 'Out') this.movementType.set(value);
  }

  setReason(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const reason = this.movementReasons.find((option) => option === value);
    if (reason) this.reason.set(reason);
  }

  recordMovement(): void {
    const part = this.part.value();
    if (!part || !this.canRecordMovement() || this.loading()) return;

    const movement: CreateStockMovement = {
      movementType: this.movementType(),
      reason: this.reason(),
    };
    this.loading.set(true);
    this.message.set('');
    this.messageType.set('');

    this.sparePartService
      .createStockMovement(part.id, movement)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.message.set(response.message);
          this.messageType.set('success');
          this.showMovementForm.set(false);
          this.part.reload();
        },
        error: (error: unknown) => {
          console.error('Error recording spare part stock movement:', error);
          this.message.set(
            error instanceof HttpErrorResponse
              ? error.error?.error ?? error.error?.message ?? 'Could not record stock movement.'
              : 'Could not record stock movement.',
          );
          this.messageType.set('error');
        },
      });
  }
}
