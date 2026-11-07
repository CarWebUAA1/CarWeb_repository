import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, isEmployeeRole } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-form.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  protected readonly message = signal('');
  protected readonly isSuccess = signal(false);
  protected readonly isLoading = signal(false);

  login(event: Event): void {
    event.preventDefault();
    if (this.isLoading()) return;

    this.message.set('');
    this.isSuccess.set(false);
    this.isLoading.set(true);

    this.auth
      .login({ email: this.email.trim(), password: this.password })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.isSuccess.set(true);
          this.message.set(response.message || 'Login successful.');
          this.password = '';
          // Employees and managers go to the employee page; customers back to the user page.
          this.router.navigate([isEmployeeRole(response.user?.role) ? '/employee' : '/']);
        },
        error: (error: unknown) => this.message.set(errorText(error)),
      });
  }
}

function errorText(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Could not connect to the server.';
    if (typeof error.error?.message === 'string') return error.error.message;
  }
  return 'Could not log in.';
}
