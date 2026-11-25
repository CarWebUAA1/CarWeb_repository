import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ManagedAppointment } from '../../models/appointment.model';
import { ManageAppointmentComponent } from './manage-appointment.component';

const TOKEN = 'abc123';
const APPOINTMENT: ManagedAppointment = {
  appointmentId: 5,
  clientName: 'Ana Lopez',
  appointmentType: 'Sale evaluation',
  appointmentDatetime: '2026-11-27 11:00:00',
  status: 'Pending',
  cancelReason: null,
  carId: null,
  car: null,
  canCancel: true,
  canModify: true,
  saleOffer: null,
};

describe('ManageAppointmentComponent', () => {
  let fixture: ComponentFixture<ManageAppointmentComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function render(token: string, appointment: ManagedAppointment | null = APPOINTMENT) {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    fixture = TestBed.createComponent(ManageAppointmentComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('id', '5');
    fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
    if (token) {
      const request = http.expectOne('/api/v1/appointments/5/manage');
      expect(request.request.headers.get('X-Manage-Token')).toBe(TOKEN);
      if (appointment) request.flush(appointment);
      else request.flush({ message: 'appointment has not been found' }, { status: 404, statusText: 'Not Found' });
    }
    await fixture.whenStable();
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => http.verify());

  it('says the link is not valid without a token', async () => {
    await render('');
    expect(el.textContent).toContain('This link is not valid');
  });

  it('says the link is not valid when the token does not match', async () => {
    await render(TOKEN, null);
    expect(el.textContent).toContain('This link is not valid');
  });

  it('shows the appointment and offers to send the car for a sale evaluation', async () => {
    await render(TOKEN);
    expect(el.querySelector('.summary')?.textContent).toContain('Ana Lopez');
    const offer = el.querySelector<HTMLAnchorElement>('a[href^="/sell-my-car"]');
    expect(offer?.getAttribute('href')).toBe(`/sell-my-car?appointment=5&token=${TOKEN}`);
  });

  it('cancels only after the customer confirms', async () => {
    await render(TOKEN);
    const submit = Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.includes('Cancel appointment'))!;
    expect(submit.disabled).toBe(true);

    const check = el.querySelector<HTMLInputElement>('.ws-check input')!;
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    submit.closest('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/v1/appointments/5/cancel');
    expect(request.request.body).toEqual({ token: TOKEN, confirm: true });
    request.flush({ message: 'appointment has been cancelled' });
    TestBed.tick();
    http.expectOne('/api/v1/appointments/5/manage').flush({ ...APPOINTMENT, status: 'Cancelled', canCancel: false, canModify: false });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.ws-message--success')?.textContent).toContain('cancelled');
  });

  it('asks to call when the appointment is less than 2 hours away', async () => {
    await render(TOKEN, { ...APPOINTMENT, canModify: false });
    expect(el.querySelector('#new-datetime')).toBeNull();
    expect(el.textContent).toContain('call the dealership');
  });
});
