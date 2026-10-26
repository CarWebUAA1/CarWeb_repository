import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CarCardComponent } from '../../components/car-card/car-card.component';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-car-catalog',
  imports: [RouterLink, CarCardComponent],
  templateUrl: './car-catalog.component.html',
  styleUrl: './car-catalog.component.css',
})
export class CarCatalogComponent {
  private readonly carService = inject(CarService);

  /** `?page=` query param, bound by the router (withComponentInputBinding). */
  readonly page = input<string>();

  protected readonly currentPage = computed(() => {
    const parsed = Number(this.page());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  });

  protected readonly cars = rxResource({
    params: () => this.currentPage(),
    stream: ({ params: page }) => this.carService.getCars(page),
  });
}
