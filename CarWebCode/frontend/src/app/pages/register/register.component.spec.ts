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
    name: 'Juan Pérez',
    phone: '4491234567',
    email: 'juan@example.com',
    password: 'secreta123',
    confirmPassword: 'secreta123',
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
    expect(el.querySelector('.message')?.textContent).toContain('Revisa los campos');
  });

  it('does not call the API when passwords differ', () => {
    fill({ ...valid, confirmPassword: 'otra-clave' });
    submit();
    http.expectNone('/api/v1/users/register');
    expect(el.querySelector('.message')?.textContent).toContain('no coinciden');
  });

  it('sends the user and shows the backend message', () => {
    fill(valid);
    submit();
    const req = http.expectOne('/api/v1/users/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      Name: 'Juan Pérez',
      Phone: '4491234567',
      Email: 'juan@example.com',
      Password: 'secreta123',
    });
    req.flush({ ok: true, message: 'Usuario registrado correctamente.', userId: 1 }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(el.querySelector('.message.success')?.textContent).toContain('Usuario registrado correctamente.');
  });

  it('shows the backend error message', () => {
    fill(valid);
    submit();
    http
      .expectOne('/api/v1/users/register')
      .flush({ ok: false, message: 'Ya existe una cuenta con ese correo.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(el.querySelector('.message.error')?.textContent).toContain('Ya existe una cuenta');
  });
});
