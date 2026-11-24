import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SparePartDetailComponent } from './spare-part-detail.component';

describe('SparePartDetailComponent', () => {
  let fixture: ComponentFixture<SparePartDetailComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [SparePartDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  async function render(role?: string, inventoryStatus = 'In stock') {
    if (role) {
      sessionStorage.setItem('carweb.user', JSON.stringify({
        id: 8,
        name: 'Staff User',
        email: 'staff@example.com',
        role,
      }));
      sessionStorage.setItem('carweb.token', 'test-token');
    }

    fixture = TestBed.createComponent(SparePartDetailComponent);
    fixture.componentRef.setInput('id', '5');
    fixture.detectChanges();
    http.expectOne('/api/v1/spare-parts/5').flush({
      id: 5,
      carId: 31,
      brand: 'Nissan',
      model: 'Versa',
      status: 'Available',
      price: 2200,
      inventoryStatus,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => http.verify());

  it('shows part details without the related car ID', async () => {
    const element = await render();

    expect(element.querySelector('.specs')?.textContent).toContain('Nissan');
    expect(element.querySelector('.specs')?.textContent).not.toContain('Car ID');
    expect(element.querySelector('.movement-button')).toBeNull();
  });

  it('lets an employee record a stock movement', async () => {
    const element = await render('employee');
    element.querySelector<HTMLButtonElement>('.movement-button')!.click();
    fixture.detectChanges();

    const form = element.querySelector<HTMLFormElement>('.movement-form')!;
    const movementType = form.querySelector<HTMLSelectElement>('#movementType')!;
    movementType.value = 'Out';
    movementType.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    const movementRequest = http.expectOne('/api/v1/spare-parts/5/stock-movements');
    expect(movementRequest.request.method).toBe('POST');
    expect(movementRequest.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(movementRequest.request.body).toEqual({ movementType: 'Out', reason: 'Spare parts' });
    movementRequest.flush({
      message: 'Stock movement recorded successfully',
      data: {
        id: 1,
        sparePartId: 5,
        movementType: 'Out',
        reason: 'Spare parts',
        movementDate: '2026-11-20T12:00:00.000Z',
      },
    });

    fixture.detectChanges();
    http.expectOne('/api/v1/spare-parts/5').flush({
      id: 5,
      carId: 31,
      brand: 'Nissan',
      model: 'Versa',
      status: 'Available',
      price: 2200,
      inventoryStatus: 'Out of stock',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.textContent).toContain('Stock movement recorded successfully');
  });

  it('also shows the stock movement button to a manager', async () => {
    const element = await render('manager');
    expect(element.querySelector('.movement-button')).not.toBeNull();
  });

  it('defaults to stock in when the part is out of stock', async () => {
    const element = await render('employee', 'Out of stock');
    element.querySelector<HTMLButtonElement>('.movement-button')!.click();
    fixture.detectChanges();

    expect(element.querySelector<HTMLSelectElement>('#movementType')?.value).toBe('In');
  });
});
