import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PendingTestDriveAppointment, UpcomingTestDrive } from '../../models/test-drive.model';
import EmployeeTestDrivesComponent, { addMinutes } from './employee-test-drives.component';

const PENDING: PendingTestDriveAppointment[] = [
  { appointmentId: 9, clientName: 'Carlos Vega', appointmentDatetime: '2026-11-20 17:00:00', carId: 2, car: 'Honda Civic 2019' },
  { appointmentId: 10, clientName: 'Laura Rios', appointmentDatetime: '2026-11-21 10:00:00', carId: null, car: null },
];
const UPCOMING: UpcomingTestDrive[] = [
  {
    id: 1,
    scheduleStart: '2026-11-20 16:00:00',
    scheduleEnd: '2026-11-20 16:45:00',
    carId: 2,
    car: 'Honda Civic 2019',
    clientName: 'Sofia Mendez',
    employeeName: 'Luis Medina',
  },
];

describe('EmployeeTestDrivesComponent', () => {
  let fixture: ComponentFixture<EmployeeTestDrivesComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function render(role: string) {
    sessionStorage.setItem('carweb.user', JSON.stringify({ id: 1, name: 'Ana', email: 'ana@carweb.test', role }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(EmployeeTestDrivesComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/v1/test-drives/pending-appointments').flush(PENDING);
    http.expectOne('/api/v1/test-drives').flush(UPCOMING);
    await fixture.whenStable();
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  async function choose(appointmentId: string) {
    const select = el.querySelector<HTMLSelectElement>('#appointment')!;
    select.value = appointmentId;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('lists the pending appointments and the upcoming test drives', async () => {
    await render('employee');
    const options = Array.from(el.querySelectorAll('#appointment option')).map((o) => o.textContent?.trim());
    expect(options[1]).toContain('Carlos Vega');
    expect(options[1]).toContain('Honda Civic 2019');
    const row = el.querySelector('.upcoming tbody tr')?.textContent;
    expect(row).toContain('Nov 20, 2026, 4:00 PM');
    expect(row).toContain('Sofia Mendez');
    expect(row).toContain('Luis Medina');
  });

  it('suggests the appointment time and a 45-minute test drive', async () => {
    await render('employee');
    await choose('9');
    expect(el.querySelector('.schedule__car')?.textContent).toContain('Honda Civic 2019');
    expect(el.querySelector<HTMLInputElement>('#start')?.value).toBe('2026-11-20T17:00');
    expect(el.querySelector<HTMLInputElement>('#end')?.value).toBe('2026-11-20T17:45');
  });

  it('schedules the test drive for the logged-in employee and refreshes the lists', async () => {
    await render('employee');
    await choose('9');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne((r) => r.method === 'POST' && r.url === '/api/v1/test-drives');
    expect(req.request.body).toEqual({
      appointmentId: 9,
      employeeId: 1,
      carId: 2,
      scheduleStart: '2026-11-20T17:00',
      scheduleEnd: '2026-11-20T17:45',
    });
    req.flush({ id: 2, ...req.request.body }, { status: 201, statusText: 'Created' });
    TestBed.tick(); // the resources reload on the next change detection
    http.expectOne('/api/v1/test-drives/pending-appointments').flush([]);
    http.expectOne('/api/v1/test-drives').flush(UPCOMING);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.message.success')?.textContent).toContain('Test drive scheduled for Carlos Vega.');
  });

  it('shows the overlap error from the backend', async () => {
    await render('employee');
    await choose('9');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http
      .expectOne((r) => r.method === 'POST')
      .flush(
        { error: 'The car already has a test drive from 2026-11-20 16:00:00 to 2026-11-20 16:45:00' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();
    expect(el.querySelector('.message.error')?.textContent).toContain('The car already has a test drive');
  });

  it('does not let an appointment without a car be scheduled', async () => {
    await render('employee');
    await choose('10');
    expect(el.textContent).toContain('This appointment has no car assigned');
    expect(el.querySelector('.schedule__submit')).toBeNull();
  });

  it('lets a manager schedule too (managers can do every employee task)', async () => {
    await render('manager');
    await choose('9');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne((r) => r.method === 'POST' && r.url === '/api/v1/test-drives');
    expect(req.request.body.employeeId).toBe(1);
    req.flush({ id: 2, ...req.request.body }, { status: 201, statusText: 'Created' });
    TestBed.tick();
    http.expectOne('/api/v1/test-drives/pending-appointments').flush([]);
    http.expectOne('/api/v1/test-drives').flush(UPCOMING);
  });
});

describe('addMinutes', () => {
  it.each([
    ['2026-11-20T17:00', 45, '2026-11-20T17:45'],
    ['2026-11-20T23:30', 45, '2026-11-21T00:15'],
    ['2026-12-31T23:50', 15, '2027-01-01T00:05'],
  ])('%s + %i min = %s', (value, minutes, expected) => {
    expect(addMinutes(value, minutes)).toBe(expected);
  });
});
