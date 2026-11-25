import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { StaffDetailsRequest, StaffMember } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-staff-management',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './staff-management.component.html',
  host: { class: 'block min-h-dvh text-text' },
})
export class StaffManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly search = signal('');
  protected readonly selectedStaff = signal<StaffMember | null>(null);
  protected readonly creating = signal(false);
  protected readonly editing = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error' | ''>('');
  protected readonly filteredStaff = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) return this.staff();
    return this.staff().filter((member) =>
      member.name.toLocaleLowerCase().includes(query) ||
      String(member.id).includes(query)
    );
  });

  protected readonly staffForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(15)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role: this.fb.nonNullable.control<StaffMember['role']>('employee', Validators.required),
    password: ['', Validators.minLength(8)],
  });

  ngOnInit(): void {
    this.loadStaff();
  }

  protected selectStaff(member: StaffMember): void {
    this.selectedStaff.set(member);
    this.creating.set(false);
    this.editing.set(false);
    this.message.set('');
    this.staffForm.controls.password.setValidators(Validators.minLength(8));
    this.staffForm.controls.password.updateValueAndValidity();
    this.staffForm.reset({
      name: member.name,
      phone: member.phone,
      email: member.email,
      role: member.role,
      password: '',
    });
  }

  protected beginCreate(): void {
    this.selectedStaff.set(null);
    this.creating.set(true);
    this.editing.set(true);
    this.message.set('');
    this.staffForm.reset({
      name: '',
      phone: '',
      email: '',
      role: 'employee',
      password: '',
    });
    this.staffForm.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.staffForm.controls.password.updateValueAndValidity();
  }

  protected beginEdit(): void {
    this.editing.set(true);
    this.staffForm.controls.password.setValidators(Validators.minLength(8));
    this.staffForm.controls.password.updateValueAndValidity();
  }

  protected cancelEdit(): void {
    const selected = this.selectedStaff();
    if (!selected) {
      this.creating.set(false);
      this.editing.set(false);
      return;
    }

    this.selectStaff(selected);
  }

  protected saveStaff(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const value = this.staffForm.getRawValue();
    const current = this.selectedStaff();
    if (!this.creating() && !current) return;
    const details: StaffDetailsRequest = {
      name: value.name.trim(),
      phone: value.phone.trim(),
      email: value.email.trim(),
      role: value.role,
      ...(value.password ? { password: value.password } : {}),
    };
    this.saving.set(true);
    this.message.set('');
    this.messageType.set('');

    const request = this.creating()
      ? this.userService.registerStaff(details)
      : this.userService.updateStaff(current!.id, details);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.messageType.set('success');
        this.loadStaff(response.staffId, response.message);
        this.creating.set(false);
        this.editing.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.message.set(error.error?.message ?? 'Could not save staff details.');
        this.messageType.set('error');
      },
    });
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected deactivateStaff(member: StaffMember): void {
    if (!window.confirm(`Deactivate ${member.name} (ID ${member.id})?`)) return;

    this.saving.set(true);
    this.userService.deleteStaff(member.id).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: (response) => {
        this.selectedStaff.set(null);
        this.editing.set(false);
        this.creating.set(false);
        this.message.set(response.message);
        this.messageType.set('success');
        this.loadStaff();
      },
      error: (error: { error?: { message?: string } }) => {
        this.message.set(error.error?.message ?? 'Could not deactivate the staff member.');
        this.messageType.set('error');
      },
    });
  }

  private loadStaff(selectId?: number, successMessage?: string): void {
    this.loading.set(true);
    this.userService.getStaff()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ staff }) => {
          this.staff.set(staff);
          if (selectId) {
            const created = staff.find((member) => member.id === selectId);
            if (created) this.selectStaff(created);
          } else if (this.selectedStaff()) {
            const updated = staff.find((member) => member.id === this.selectedStaff()?.id);
            if (updated) this.selectStaff(updated);
          }
          if (successMessage) {
            this.message.set(successMessage);
            this.messageType.set('success');
          }
        },
        error: (error: { error?: { message?: string } }) => {
          this.message.set(error.error?.message ?? 'Could not load staff.');
          this.messageType.set('error');
        },
      });
  }
}
