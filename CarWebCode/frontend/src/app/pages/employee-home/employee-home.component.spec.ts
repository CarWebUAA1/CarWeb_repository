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
    expect(el.querySelector('.employee-header__name')?.textContent).toContain('Ana');
  });

  it('lists the employee tasks; only Test drives is available so far', () => {
    expect(el.querySelectorAll('.task').length).toBe(7);
    expect(el.querySelectorAll('.task__badge').length).toBe(6);
    const link = el.querySelector<HTMLAnchorElement>('a.task--link');
    expect(link?.textContent).toContain('Test drives');
    expect(link?.getAttribute('href')).toBe('/employee/test-drives');
  });

  it('logs out and goes back to the login', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    el.querySelector<HTMLButtonElement>('.employee-header__logout')!.click();
    expect(sessionStorage.getItem('carweb.user')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
