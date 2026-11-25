import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import EmployeeHomeComponent from './employee-home.component';

describe('EmployeeHomeComponent', () => {
  let fixture: ComponentFixture<EmployeeHomeComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    sessionStorage.setItem(
      'carweb.user',
      JSON.stringify({ id: 7, name: 'Ana', email: 'ana@carweb.com', role: 'employee' }),
    );
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    fixture = TestBed.createComponent(EmployeeHomeComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => sessionStorage.clear());

  it('greets the logged-in employee', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Welcome, Ana');
    expect(el.querySelector('.portal-header__name')?.textContent).toContain('Ana');
  });

  it('lists employee tasks and links to the spare parts catalog', () => {
    expect(el.querySelectorAll('.task').length).toBe(9);
    expect(el.querySelectorAll('.task__badge')[0]?.textContent).toContain('Coming soon');
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.task__link'));
    expect(links.some((link) => link.getAttribute('href') === '/employee/profile')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/spare-parts')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/employee/appointments')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/employee/test-drives')).toBe(true);
  });

  it('logs out and goes back to the login', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    el.querySelector<HTMLButtonElement>('.portal-header__logout')!.click();
    expect(sessionStorage.getItem('carweb.user')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
