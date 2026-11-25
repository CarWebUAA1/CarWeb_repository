import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InventoryCar } from '../../models/inventory.model';
import { ManagerInventoryComponent } from './manager-inventory.component';

const CAR: InventoryCar = {
  carId: 3,
  vin: '1HGCM82633A004352',
  plates: 'ABC123',
  brand: 'Honda',
  model: 'Civic',
  year: 2022,
  version: 'Touring',
  series: null,
  mileage: 15000,
  fuelType: 'Gasoline',
  transmission: 'Automatic',
  color: 'Blue',
  status: 'Available',
  tireCondition: 'Good',
  serviceHistory: null,
  purchasePrice: 250000,
  basePrice: null,
  salePrice: 290000,
  testDriveAuthorized: true,
  photos: [],
  inventoryStatus: 'In stock',
  createdAt: '2026-11-19 10:00:00',
  updatedAt: '2026-11-19 10:00:00',
};

describe('ManagerInventoryComponent', () => {
  let fixture: ComponentFixture<ManagerInventoryComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const button = (text: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim().startsWith(text))!;

  async function refresh() {
    TestBed.tick();
    await Promise.resolve();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.setItem('carweb.token', 'jwt-token');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    fixture = TestBed.createComponent(ManagerInventoryComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const list = http.expectOne('/api/v1/cars/getAllCars');
    expect(list.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    list.flush([CAR]);
    el = fixture.nativeElement;
    await refresh();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('lists the cars in stock', () => {
    const row = el.querySelector('tbody tr')?.textContent;
    expect(row).toContain('Honda Civic 2022');
    expect(row).toContain('1HGCM82633A004352');
    expect(row).toContain('Available');
  });

  it('asks for confirmation before selling below the purchase price', async () => {
    button('Price').click();
    await refresh();
    const input = el.querySelector<HTMLInputElement>('#new-price')!;
    input.value = '200000';
    input.dispatchEvent(new Event('input'));
    await refresh();
    expect(button('Save price').disabled).toBe(true);

    const confirm = el.querySelector<HTMLInputElement>('.price-form .ws-check input')!;
    confirm.checked = true;
    confirm.dispatchEvent(new Event('change'));
    await refresh();
    button('Save price').closest('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/v1/cars/updatePrice/3');
    expect(request.request.body).toEqual({ salePrice: 200000, confirmLowerSalePrice: true });
    request.flush({ message: 'sale price has been updated' });
    await refresh();
    http.expectOne('/api/v1/cars/getAllCars').flush([CAR]);
  });

  it('removes a car after a second click', async () => {
    el.querySelector<HTMLButtonElement>('[aria-label="Remove car 3"]')!.click();
    await refresh();
    button('Yes').click();
    const request = http.expectOne('/api/v1/cars/deleteCar/3');
    expect(request.request.method).toBe('DELETE');
    request.flush({ message: 'car has been deleted' });
    await refresh();
    http.expectOne('/api/v1/cars/getAllCars').flush([]);
    await refresh();
    expect(el.querySelector('.ws-message--success')?.textContent).toContain('taken out');
  });

  it('validates the car form before sending it', async () => {
    button('Add car').click();
    await refresh();
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await refresh();
    expect(el.querySelector('.ws-error')?.textContent).toContain('17 letters');
    http.expectNone('/api/v1/cars/createCar');
  });
});
