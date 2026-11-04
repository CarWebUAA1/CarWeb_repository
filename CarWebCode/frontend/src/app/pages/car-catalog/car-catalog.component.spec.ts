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

  async function render(pageParam: string | undefined, response: Paginated<CarSummary>, search?: string) {
    fixture.componentRef.setInput('page', pageParam);
    fixture.componentRef.setInput('search', search);
    fixture.detectChanges();
    const query = search ? `page=${response.page}&search=${encodeURIComponent(search.trim())}` : `page=${response.page}`;
    http.expectOne(`/api/v1/cars?${query}`).flush(response);
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
    expect(el.querySelector('.pagination')?.textContent).toContain('Page 1 of 2');
  });

  it('shows a message when there are no cars', async () => {
    const el = await render('1', page(0, 0));
    expect(el.textContent).toContain('There are no cars available');
    expect(el.querySelector('.pagination')).toBeNull();
  });

  it('sends the search term and shows what is being searched', async () => {
    const el = await render(undefined, page(2, 2), ' toyota ');
    expect(el.querySelectorAll('app-car-card')).toHaveLength(2);
    expect(el.querySelector('.catalog__search')?.textContent).toContain('Results for “toyota”');
  });

  it('shows "No cars match your search" with a link to clear the search', async () => {
    const el = await render(undefined, page(0, 0), 'xyz');
    expect(el.textContent).toContain('No cars match your search.');
    expect(el.textContent).not.toContain('There are no cars available');
    const clear = el.querySelector<HTMLAnchorElement>('.catalog__status a');
    expect(clear?.textContent).toContain('Clear search');
    expect(clear?.getAttribute('href')).toBe('/cars');
  });

  it('falls back to page 1 for an invalid page param', async () => {
    const el = await render('abc', page(3, 3));
    expect(el.querySelectorAll('app-car-card')).toHaveLength(3);
  });
});
