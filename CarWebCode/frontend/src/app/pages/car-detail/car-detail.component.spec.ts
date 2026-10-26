import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarDetail } from '../../models/car.model';
import { CarDetailComponent } from './car-detail.component';

function car(overrides: Partial<CarDetail> = {}): CarDetail {
  return {
    id: 3,
    brand: 'Honda',
    model: 'Civic',
    year: 2019,
    version: 'EX',
    series: 'FC',
    mileage: 61000,
    fuelType: 'Gasoline',
    transmission: 'CVT',
    color: 'Black',
    tireCondition: 'Good',
    price: 268000,
    status: 'Available',
    isAvailable: true,
    photos: [
      { id: 1, url: 'https://example.com/1.jpg', isMain: true },
      { id: 2, url: 'https://example.com/2.jpg', isMain: false },
    ],
    serviceHistory: [{ date: '2021-04-15', mileage: 20000, description: 'Cambio de aceite' }],
    ...overrides,
  };
}

describe('CarDetailComponent', () => {
  let fixture: ComponentFixture<CarDetailComponent>;
  let http: HttpTestingController;

  async function render(response: CarDetail | null) {
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
    const req = http.expectOne('/api/v1/cars/3');
    if (response) req.flush(response);
    else req.flush({ error: 'Car not found' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CarDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(CarDetailComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the car information, photos and disabled actions', async () => {
    const el = await render(car());
    expect(el.querySelector('h1')?.textContent).toContain('Honda Civic 2019');
    expect(el.querySelector('.specs')?.textContent).toContain('CVT');
    expect(el.querySelectorAll('.gallery__thumb')).toHaveLength(2);
    expect(el.textContent).toContain('Cambio de aceite');
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('app-button button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Agendar cita', 'Comprar']);
    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect(el.querySelector('.detail__warning')).toBeNull();
  });

  it('warns when the car is no longer available', async () => {
    const el = await render(car({ status: 'Sold', isAvailable: false }));
    expect(el.querySelector('.detail__warning')?.textContent).toContain('ya no está disponible');
  });

  it('shows a not-found message for a missing car', async () => {
    const el = await render(null);
    expect(el.textContent).toContain('No encontramos este auto');
  });

  it('uses the placeholder when the car has no photos', async () => {
    const el = await render(car({ photos: [] }));
    const main = el.querySelector<HTMLImageElement>('.gallery__main');
    expect(main?.getAttribute('src')).toBe('/assets/images/car-placeholder.svg');
  });
});
