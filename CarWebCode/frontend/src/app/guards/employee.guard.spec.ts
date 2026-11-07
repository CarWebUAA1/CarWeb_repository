import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { employeeGuard } from './employee.guard';

function runGuard(savedUser: object | null) {
  sessionStorage.clear();
  if (savedUser) sessionStorage.setItem('carweb.user', JSON.stringify(savedUser));
  TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  return TestBed.runInInjectionContext(() =>
    employeeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('employeeGuard', () => {
  it('lets employees in', () => {
    expect(runGuard({ id: 1, name: 'Ana', email: 'a@x.com', role: 'employee' })).toBe(true);
  });

  it('lets managers in', () => {
    expect(runGuard({ id: 2, name: 'Luis', email: 'l@x.com', role: 'manager' })).toBe(true);
  });

  it.each([
    ['nobody logged in', null],
    ['a customer', { id: 3, name: 'John', email: 'j@x.com', role: 'client' }],
  ])('sends %s to the login', (_label, user) => {
    const result = runGuard(user);
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });
});
