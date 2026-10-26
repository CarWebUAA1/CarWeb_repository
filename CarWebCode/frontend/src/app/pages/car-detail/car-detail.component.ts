import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../components/button/button.component';
import { CAR_PLACEHOLDER, ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { CarService } from '../../services/car.service';

/** How often the page re-checks that the car is still available. */
const AVAILABILITY_CHECK_MS = 30_000;

@Component({
  selector: 'app-car-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, ButtonComponent, ImgFallbackDirective],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.css',
})
export class CarDetailComponent {
  private readonly carService = inject(CarService);

  /** `:id` route param, bound by the router (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly placeholder = CAR_PLACEHOLDER;

  protected readonly car = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.carService.getCar(id),
  });

  /** Index of the photo shown large; goes back to 0 when another car loads. */
  protected readonly selectedPhoto = linkedSignal({
    source: () => this.car.value()?.id,
    computation: () => 0,
  });

  protected readonly mainPhotoUrl = computed(() => {
    const photos = this.car.value()?.photos ?? [];
    return photos[this.selectedPhoto()]?.url ?? this.placeholder;
  });

  constructor() {
    // Re-fetch periodically so the user is warned if the car is sold or reserved meanwhile.
    // While reloading, the resource keeps showing the previous value.
    const timer = setInterval(() => this.car.reload(), AVAILABILITY_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
