import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StaffAppointment } from '../../models/appointment.model';
import EmployeeAppointmentsComponent from './employee-appointments.component';

const base: Omit<StaffAppointment, 'appointmentId' | 'status' | 'appointmentDatetime'> = {
  clientName: 'Carlos Vega',
  clientPhone: '4491234567',
  clientEmail: 'carlos@mail.com',
  carId: 2,
  car: 'Honda Civic 2019',
  appointmentType: 'Viewing',
  employeeId: null,
  employeeName: null,
  createdAt: '2026-11-19 10:00:00',
};
const APPOINTMENTS: StaffAppointment[] = [
  { ...base, appointmentId: 9, status: 'Pending', appointmentDatetime: '2026-11-27 11:00:00' },
  { ...base, appointmentId: 8, status: 'Confirmed', appointmentDatetime: '2026-11-26 10:00:00', clientName: 'Laura Rios' },
  { ...base, appointmentId: 7, status: 'Cancelled', appointmentDatetime: '2026-11-25 10:00:00', clientName: 'Sofia Mendez' },
];

describe('EmployeeAppointmentsComponent', () => {
  let fixture: ComponentFixture<EmployeeAppointmentsComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const rows = () => Array.from(el.querySelectorAll('tbody tr'));
  const button = (text: string, scope: ParentNode = el) =>
    Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim().startsWith(text))!;

  async function refresh() {
    TestBed.tick();
    await Promise.resolve();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.setItem('carweb.user', JSON.stringify({ id: 1, name: 'Ana', email: 'ana@carweb.test', role: 'employee' }));
    sessionStorage.setItem('carweb.token', 'jwt-token');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    fixture = TestBed.createComponent(EmployeeAppointmentsComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const list = http.expectOne('/api/v1/appointments');
    expect(list.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    list.flush({ ok: true, data: APPOINTMENTS });
    el = fixture.nativeElement;
    await refresh();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('shows the pending appointments first, with counts per status', () => {
    expect(rows()).toHaveLength(1);
    expect(rows()[0]?.textContent).toContain('Carlos Vega');
    expect(button('Pending').textContent).toContain('(1)');
    expect(button('All').textContent).toContain('(3)');
  });

  it('confirms an appointment and reloads the list', async () => {
    button('Confirm', rows()[0]!).click();
    const request = http.expectOne('/api/v1/appointments/9/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'Confirmed' });
    request.flush({ ok: true, message: 'ok' });
    TestBed.tick();
    http.expectOne('/api/v1/appointments').flush({ ok: true, data: APPOINTMENTS });
    await refresh();
    expect(el.querySelector('.ws-message')?.textContent).toContain('confirmed');
  });

  it('asks for a reason before rejecting', async () => {
    button('Reject', rows()[0]!).click();
    await refresh();
    const form = el.querySelector<HTMLFormElement>('.action-form')!;
    form.dispatchEvent(new Event('submit'));
    await refresh();
    expect(el.querySelector('.ws-message--error')?.textContent).toContain('reason');
    http.expectNone('/api/v1/appointments/9/status');

    const reason = el.querySelector<HTMLTextAreaElement>('#reason')!;
    reason.value = 'The car is in maintenance';
    reason.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/v1/appointments/9/status');
    expect(request.request.body).toEqual({ status: 'Rejected', reason: 'The car is in maintenance' });
    request.flush({ ok: true, message: 'ok' });
    TestBed.tick();
    http.expectOne('/api/v1/appointments').flush({ ok: true, data: APPOINTMENTS });
  });

  it('shows the API error when an action fails', async () => {
    button('Confirm', rows()[0]!).click();
    http
      .expectOne('/api/v1/appointments/9/status')
      .flush({ error: 'Appointment not found or its current status does not allow this action' }, { status: 409, statusText: 'Conflict' });
    await refresh();
    expect(el.querySelector('.ws-message--error')?.textContent).toContain('does not allow this action');
  });
});
