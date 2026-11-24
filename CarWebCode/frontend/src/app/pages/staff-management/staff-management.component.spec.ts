import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StaffManagementComponent } from './staff-management.component';

describe('StaffManagementComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<StaffManagementComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    sessionStorage.setItem('carweb.token', 'manager-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StaffManagementComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;

    const request = http.expectOne('/api/v1/users');
    expect(request.request.headers.get('Authorization')).toBe('Bearer manager-token');
    request.flush({
      staff: [
        { id: 12, name: 'Ana García', phone: '5551234', email: 'ana@example.com', role: 'employee' },
        { id: 23, name: 'Luis Pérez', phone: '5554321', email: 'luis@example.com', role: 'manager' },
      ],
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('filters staff by name or ID and shows the selected staff actions', () => {
    const search = element.querySelector<HTMLInputElement>('#staff-search')!;
    search.value = '23';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cards = element.querySelectorAll<HTMLButtonElement>('.staff-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Luis Pérez');
    cards[0].click();
    fixture.detectChanges();

    expect(element.querySelector('.staff-detail h2')?.textContent).toContain('Luis Pérez');
    expect(element.querySelector('.staff-detail__heading button')?.textContent).toContain('Edit details');
  });

  it('opens the registration form from the staff enrollment action', () => {
    element.querySelector<HTMLButtonElement>('.staff-page__heading .primary-button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('.staff-detail h2')?.textContent).toContain('Add staff member');
    expect(element.querySelector('input[type="password"]')).not.toBeNull();
  });
});
