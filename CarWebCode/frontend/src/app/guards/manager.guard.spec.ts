import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { managerGuard } from './manager.guard';

function runGuard(user: object | null, token = 'token') {
  sessionStorage.clear();
  if (user) sessionStorage.setItem('carweb.user', JSON.stringify(user));
  if (token) sessionStorage.setItem('carweb.token', token);
  TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  return TestBed.runInInjectionContext(() =>
    managerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('managerGuard', () => {
  it('lets managers in when they have a session token', () => {
    expect(runGuard({ id: 2, name: 'Luis', email: 'l@x.com', role: 'manager' })).toBe(true);
  });

  it.each([
    ['nobody logged in', null, 'token'],
    ['an employee', { id: 1, name: 'Ana', email: 'a@x.com', role: 'employee' }, 'token'],
    ['a customer', { id: 3, name: 'John', email: 'j@x.com', role: 'client' }, 'token'],
    ['a manager without a token', { id: 2, name: 'Luis', email: 'l@x.com', role: 'manager' }, ''],
  ])('sends %s to the login', (_label, user, token) => {
    const result = runGuard(user, token);
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });
});
