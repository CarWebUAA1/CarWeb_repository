import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  function fill(values: Record<string, string>) {
    for (const [id, value] of Object.entries(values)) {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  function submit() {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const valid = {
    name: 'John Smith',
    phone: '4491234567',
    email: 'john@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(RegisterComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  it('does not call the API when required fields are empty', () => {
    submit();
    http.expectNone('/api/v1/users/register');
    expect(el.querySelector('.message')?.textContent).toContain('Please fill in the required fields');
  });

  it('does not call the API when passwords differ', () => {
    fill({ ...valid, confirmPassword: 'other-password' });
    submit();
    http.expectNone('/api/v1/users/register');
    expect(el.querySelector('.message')?.textContent).toContain('do not match');
  });

  it('sends the user and shows the backend message', () => {
    fill(valid);
    submit();
    const req = http.expectOne('/api/v1/users/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      Name: 'John Smith',
      Phone: '4491234567',
      Email: 'john@example.com',
      Password: 'secret123',
    });
    req.flush({ ok: true, message: 'User registered successfully.', userId: 1 }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(el.querySelector('.message.success')?.textContent).toContain('User registered successfully.');
  });

  it('shows the backend error message', () => {
    fill(valid);
    submit();
    http
      .expectOne('/api/v1/users/register')
      .flush({ ok: false, message: 'An account with that email already exists.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(el.querySelector('.message.error')?.textContent).toContain('An account with that email already exists');
  });
});
