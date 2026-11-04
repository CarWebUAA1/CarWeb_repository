import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CarCardComponent } from '../../components/car-card/car-card.component';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-car-catalog',
  imports: [SiteHeaderComponent, RouterLink, CarCardComponent],
  templateUrl: './car-catalog.component.html',
  styleUrl: './car-catalog.component.css',
})
export class CarCatalogComponent {
  private readonly carService = inject(CarService);

  /** `?page=` query param, bound by the router (withComponentInputBinding). */
  readonly page = input<string>();
  /** `?search=` query param sent by the header search bar (US-04). */
  readonly search = input<string>();

  protected readonly currentPage = computed(() => {
    const parsed = Number(this.page());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  });

  protected readonly searchTerm = computed(() => this.search()?.trim() ?? '');

  protected readonly cars = rxResource({
    params: () => ({ page: this.currentPage(), search: this.searchTerm() }),
    stream: ({ params }) => this.carService.getCars(params.page, params.search),
  });
}
