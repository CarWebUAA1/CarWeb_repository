import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UserService } from '../../services/user.service';

interface FormMessage {
  text: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly userService = inject(UserService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  protected readonly submitting = signal(false);
  protected readonly message = signal<FormMessage | null>(null);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set({ text: 'Revisa los campos obligatorios.', type: 'error' });
      return;
    }

    const { name, phone, email, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.message.set({ text: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }

    this.message.set(null);
    this.submitting.set(true);
    this.userService
      .register({ Name: name.trim(), Phone: phone.trim(), Email: email.trim(), Password: password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          this.message.set({ text: res.message, type: 'success' });
          this.form.reset();
        },
        error: (err: unknown) => this.message.set({ text: errorText(err), type: 'error' }),
      });
  }
}

function errorText(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor.';
    if (typeof err.error?.message === 'string') return err.error.message;
  }
  return 'No se pudo registrar el usuario.';
}
