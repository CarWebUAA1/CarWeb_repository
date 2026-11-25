import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { StaffMember } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-employee-profile',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './employee-profile.component.html',
  host: { class: 'block min-h-dvh bg-page' },
})
export class EmployeeProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  protected readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error' | ''>('');
  protected readonly profile = signal<StaffMember | null>(null);

  protected readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(15)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', Validators.minLength(8)],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.userService.getOwnProfile().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ staff }) => {
        this.profile.set(staff);
        this.profileForm.reset({
          name: staff.name,
          phone: staff.phone,
          email: staff.email,
          password: '',
        });
      },
      error: (error: { error?: { message?: string } }) => {
        this.message.set(error.error?.message ?? 'Could not load profile.');
        this.messageType.set('error');
      },
    });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    this.saving.set(true);
    this.message.set('');
    this.userService.updateOwnProfile({
      name: value.name.trim(),
      phone: value.phone.trim(),
      email: value.email.trim(),
      ...(value.password ? { password: value.password } : {}),
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.messageType.set('success');
        const current = this.profile();
        if (current) {
          this.profile.set({ ...current, name: value.name.trim(), phone: value.phone.trim(), email: value.email.trim() });
        }
        this.profileForm.controls.password.reset('');
      },
      error: (error: { error?: { message?: string } }) => {
        this.message.set(error.error?.message ?? 'Could not update profile.');
        this.messageType.set('error');
      },
    });
  }
}
