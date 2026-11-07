import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function login(email: string, password: string) {
    for (const [id, value] of [['email', email], ['password', password]]) {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(LoginComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  it('sends the credentials to the login endpoint and shows success', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await login(' john@example.com ', 'secret123');
    const req = http.expectOne('/api/v1/users/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'john@example.com', password: 'secret123' });
    req.flush({ ok: true, message: 'Login successful.', user: { id: 1, name: 'John', email: 'john@example.com', role: 'client' } });
    fixture.detectChanges();
    expect(el.querySelector('.message.success')?.textContent).toContain('Login successful.');
  });

  it.each([
    ['employee', '/employee'],
    ['manager', '/employee'],
    ['client', '/'],
  ])('sends a %s to %s after logging in', async (role, target) => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await login('john@example.com', 'secret123');
    http
      .expectOne('/api/v1/users/login')
      .flush({ ok: true, message: 'Login successful.', user: { id: 1, name: 'John', email: 'john@example.com', role } });
    expect(navigate).toHaveBeenCalledWith([target]);
  });

  it('shows the generic error for wrong credentials', async () => {
    await login('john@example.com', 'wrong-password');
    http
      .expectOne('/api/v1/users/login')
      .flush({ ok: false, message: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    const msg = el.querySelector('.message');
    expect(msg?.textContent).toContain('Invalid email or password.');
    expect(msg?.classList.contains('success')).toBe(false);
  });
});
