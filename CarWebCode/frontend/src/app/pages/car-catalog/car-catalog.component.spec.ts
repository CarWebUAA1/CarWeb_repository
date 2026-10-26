import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarSummary, Paginated } from '../../models/car.model';
import { CarCatalogComponent } from './car-catalog.component';

function page(count: number, total: number, pageNumber = 1): Paginated<CarSummary> {
  return {
    data: Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      mileage: 45200,
      price: 255000,
      photoUrl: null,
    })),
    page: pageNumber,
    pageSize: 20,
    total,
    totalPages: Math.ceil(total / 20),
  };
}

describe('CarCatalogComponent', () => {
  let fixture: ComponentFixture<CarCatalogComponent>;
  let http: HttpTestingController;

  async function render(pageParam: string | undefined, response: Paginated<CarSummary>) {
    fixture.componentRef.setInput('page', pageParam);
    fixture.detectChanges();
    http.expectOne(`/api/v1/cars?page=${response.page}`).flush(response);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CarCatalogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(CarCatalogComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the cars of the page with pagination', async () => {
    const el = await render(undefined, page(20, 24));
    expect(el.querySelectorAll('app-car-card')).toHaveLength(20);
    expect(el.querySelector('.pagination')?.textContent).toContain('Página 1 de 2');
  });

  it('shows a message when there are no cars', async () => {
    const el = await render('1', page(0, 0));
    expect(el.textContent).toContain('No hay autos disponibles');
    expect(el.querySelector('.pagination')).toBeNull();
  });

  it('falls back to page 1 for an invalid page param', async () => {
    const el = await render('abc', page(3, 3));
    expect(el.querySelectorAll('app-car-card')).toHaveLength(3);
  });
});
