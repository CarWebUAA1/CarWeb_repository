
import { Component, input, output } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-appointment-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './appointment-modal.component.html',
})
export class AppointmentModalComponent {

  private readonly fb = new FormBuilder();

  // Minimum date and time allowed for an appointment.
  readonly minDateTime = this.getCurrentDateTime();

  // Maximum date and time allowed for an appointment.
  readonly maxDateTime = this.getDateTimeAfterDays(30);

  private getDateTimeAfterDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

  private getCurrentDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

  // Selected vehicle information.
  readonly car = input.required<{
    id: number;
    brand: string;
    model: string;
    year: number;
  }>();

  // Indicates whether the appointment is being submitted.
  readonly isSubmitting = input(false);

  // Event emitted when the modal is closed.
  readonly closed = output<void>();

  // Event emitted when the appointment form is submitted.
  readonly submitted = output<{
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    appointmentType: 'Viewing' | 'Test drive' | 'Purchase';
    appointmentDatetime: string;
  }>();

  // Appointment form and field validations.
  readonly appointmentForm = this.fb.group({
    clientName: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    clientPhone: ['', [
      Validators.required,
      Validators.pattern(/^[0-9+\-()\s]{7,15}$/)
    ]],

    clientEmail: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(255)
    ]],

    appointmentType: ['Viewing' as 'Viewing' | 'Test drive' | 'Purchase', [
      Validators.required
    ]],

    appointmentDatetime: ['', [
      Validators.required
    ]]
  });

  closeModal(): void {
    this.closed.emit();
  }
  // Checks whether the selected date and time are within business hours.
  private isBusinessHours(date: Date): boolean {
    const day = date.getDay();
    const minutes = date.getHours() * 60 + date.getMinutes();

    // Sunday: no service.
    if (day === 0) {
      return false;
    }

    // Saturday: 9:00 AM to 3:00 PM.
    if (day === 6) {
      return minutes >= 540 && minutes <= 900;
    }

    // Monday to Friday: 9:00 AM to 5:00 PM.
    return minutes >= 540 && minutes <= 1020;
    }

  submitAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }
    const selectedDate = this.appointmentForm.controls.appointmentDatetime.value;

  if (selectedDate) {
    const appointmentDate = new Date(selectedDate);
    const now = new Date();
    const maxDate = new Date(this.maxDateTime);

  if (appointmentDate <= now) {
    this.appointmentForm.controls.appointmentDatetime.setErrors({
      pastDate: true
    });
    return;
  }

  if (appointmentDate > maxDate) {
    this.appointmentForm.controls.appointmentDatetime.setErrors({
      maxDate: true
    });
    return;
  }

  if (!this.isBusinessHours(appointmentDate)) {
    this.appointmentForm.controls.appointmentDatetime.setErrors({
      businessHours: true
    });
    return;
  }
}
    const data = this.appointmentForm.getRawValue();

    this.submitted.emit({
      clientName: data.clientName!,
      clientPhone: data.clientPhone!,
      clientEmail: data.clientEmail!,
      appointmentType: data.appointmentType!,
      appointmentDatetime: data.appointmentDatetime!
    });
  }
}
