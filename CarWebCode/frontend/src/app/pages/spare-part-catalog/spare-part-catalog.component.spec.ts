import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaginatedSpareParts } from '../../models/spare-part.model';
import { SparePartCatalogComponent } from './spare-part-catalog.component';

function page(data: PaginatedSpareParts['data']): PaginatedSpareParts {
  return { data, page: 1, pageSize: 20, total: data.length, totalPages: 1 };
}

describe('SparePartCatalogComponent', () => {
  let fixture: ComponentFixture<SparePartCatalogComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SparePartCatalogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(SparePartCatalogComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches parts and shows cards without requiring photos', async () => {
    fixture.componentRef.setInput('search', ' versa ');
    fixture.detectChanges();
    http.expectOne('/api/v1/spare-parts?page=1&search=versa').flush(page([{
      id: 1,
      carId: 24,
      brand: 'Nissan',
      model: 'Versa',
      status: 'Available',
      price: 2200,
      inventoryStatus: 'In stock',
    }]));
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.part-card')).toHaveLength(1);
    expect(element.querySelector('.part-card')?.textContent).toContain('Nissan Versa');
    expect(element.querySelector('.part-card')?.getAttribute('href')).toBe('/spare-parts/1');
    expect(element.querySelector('.part-card img')).toBeNull();
  });

  it('shows an empty state when a search has no matches', async () => {
    fixture.componentRef.setInput('search', 'unknown');
    fixture.detectChanges();
    http.expectOne('/api/v1/spare-parts?page=1&search=unknown').flush(page([]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No spare parts match your search.');
  });
});
