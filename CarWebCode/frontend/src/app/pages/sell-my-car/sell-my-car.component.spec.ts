import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MAX_PHOTO_BYTES, SellMyCarComponent, checkPhotos } from './sell-my-car.component';

const jpg = (size = 1000) => ({ type: 'image/jpeg', size });

describe('checkPhotos', () => {
  it('accepts 3 to 5 JPG or PNG photos of up to 5 MB', () => {
    expect(checkPhotos([jpg(), jpg(), { type: 'image/png', size: MAX_PHOTO_BYTES }])).toBeNull();
  });

  it('rejects too few or too many photos', () => {
    expect(checkPhotos([jpg(), jpg()])).toContain('between 3 and 5');
    expect(checkPhotos([jpg(), jpg(), jpg(), jpg(), jpg(), jpg()])).toContain('between 3 and 5');
  });

  it('rejects other formats and big files', () => {
    expect(checkPhotos([jpg(), jpg(), { type: 'image/gif', size: 10 }])).toContain('JPG or PNG');
    expect(checkPhotos([jpg(), jpg(), jpg(MAX_PHOTO_BYTES + 1)])).toContain('5 MB');
  });
});

describe('SellMyCarComponent', () => {
  let fixture: ComponentFixture<SellMyCarComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function render(query: { appointment?: string; token?: string } = {}) {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    fixture = TestBed.createComponent(SellMyCarComponent);
    http = TestBed.inject(HttpTestingController);
    if (query.appointment) fixture.componentRef.setInput('appointment', query.appointment);
    if (query.token) fixture.componentRef.setInput('token', query.token);
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement;
  }

  function type(selector: string, value: string) {
    const input = el.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  afterEach(() => http.verify());

  it('starts by booking the sale evaluation appointment', async () => {
    await render();
    expect(el.querySelector('#client-name')).not.toBeNull();
    expect(el.querySelector('#brand')).toBeNull();
  });

  it('books a sale evaluation without a car', async () => {
    await render();
    type('#client-name', 'Ana Lopez');
    type('#client-phone', '4491234567');
    type('#client-email', 'ana@mail.com');
    // Next Monday at 10:00, always inside business hours and the 30-day window.
    const date = new Date();
    date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7));
    const pad = (n: number) => String(n).padStart(2, '0');
    const value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
    type('#evaluation-datetime', value);
    el.querySelector<HTMLFormElement>('main form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/v1/appointments');
    expect(request.request.body).toMatchObject({
      appointmentType: 'Sale evaluation',
      carId: null,
      appointmentDatetime: value.replace('T', ' '),
    });
    request.flush({ ok: true, message: 'ok', data: { appointmentId: 12, status: 'Pending', manageToken: 'tok' } });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('Appointment #12 is booked');
    expect(el.querySelector('#brand')).not.toBeNull();
  });

  it('shows the estimate labeled "subject to inspection"', async () => {
    await render({ appointment: '12', token: 'tok' });
    type('#brand', 'Mazda');
    type('#model', '3');
    type('#year', '2020');
    type('#version', 'Sport');
    type('#mileage', '45000');
    type('#color', 'Red');
    el.querySelector<HTMLFormElement>('main form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/v1/sale-offers/estimate');
    expect(request.request.body).toMatchObject({ brand: 'Mazda', model: '3', year: 2020, mileage: 45000 });
    request.flush({ estimatedPrice: 210000, label: 'Estimated – subject to inspection' });
    fixture.detectChanges();
    expect(el.querySelector('.estimate')?.textContent).toContain('Estimated – subject to inspection');
    expect(el.querySelector('#vin')).not.toBeNull();
  });
});
