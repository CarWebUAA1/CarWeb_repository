import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, isEmployeeRole } from './auth.service';

const EMPLOYEE = { id: 7, name: 'Ana', email: 'ana@carweb.com', role: 'employee' };

describe('AuthService', () => {
  let http: HttpTestingController;

  function create() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => sessionStorage.clear());
  afterEach(() => http.verify());

  it('stores the user after a successful login', () => {
    const auth = create();
    auth.login({ email: 'ana@carweb.com', password: 'secret123' }).subscribe();
    http.expectOne('/api/v1/users/login').flush({ ok: true, message: 'Login successful.', user: EMPLOYEE });
    expect(auth.user()).toEqual(EMPLOYEE);
    expect(auth.isEmployee()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('carweb.user')!)).toEqual(EMPLOYEE);
  });

  it('restores the user saved in the tab (e.g. after a page reload)', () => {
    sessionStorage.setItem('carweb.user', JSON.stringify(EMPLOYEE));
    expect(create().user()).toEqual(EMPLOYEE);
  });

  it('clears the user on logout', () => {
    sessionStorage.setItem('carweb.user', JSON.stringify(EMPLOYEE));
    const auth = create();
    auth.logout();
    expect(auth.user()).toBeNull();
    expect(sessionStorage.getItem('carweb.user')).toBeNull();
  });
});

describe('isEmployeeRole', () => {
  it.each([
    ['employee', true],
    ['Manager', true],
    ['client', false],
    [undefined, false],
  ])('%s -> %s', (role, expected) => {
    expect(isEmployeeRole(role)).toBe(expected);
  });
});
