import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PortalHeaderComponent } from '../../components/portal-header/portal-header.component';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { AuthService } from '../../services/auth.service';
import { TestDriveService } from '../../services/test-drive.service';

/** Default length of a test drive, in minutes. */
const DEFAULT_DURATION_MIN = 45;

interface FormMessage {
  text: string;
  type: 'success' | 'error';
}

/** Employee page to schedule test drives (Manage test drive appointments). */
@Component({
  selector: 'app-employee-test-drives',
  imports: [DatePipe, RouterLink, PortalHeaderComponent, SiteFooterComponent],
  templateUrl: './employee-test-drives.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export default class EmployeeTestDrivesComponent {
  private readonly testDrives = inject(TestDriveService);
  private readonly auth = inject(AuthService);

  protected readonly pending = rxResource({ stream: () => this.testDrives.listPendingAppointments() });
  protected readonly upcoming = rxResource({ stream: () => this.testDrives.listUpcoming() });

  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed(
    () => this.pending.value()?.find((a) => a.appointmentId === this.selectedId()) ?? null,
  );
  /** Values of the <input type="datetime-local"> fields ("YYYY-MM-DDTHH:mm"). */
  protected readonly start = signal('');
  protected readonly end = signal('');

  protected readonly submitting = signal(false);
  protected readonly message = signal<FormMessage | null>(null);

  /** "YYYY-MM-DD HH:mm:ss" (no time zone) as a value the DatePipe reads in local time. */
  protected readonly toDate = (value: string) => value.replace(' ', 'T');

  selectAppointment(value: string) {
    const id = Number(value) || null;
    this.selectedId.set(id);
    this.message.set(null);
    const appointment = this.selected();
    if (!appointment) return;
    // Suggest the appointment time and the default length; the employee can change them.
    const start = appointment.appointmentDatetime.slice(0, 16).replace(' ', 'T');
    this.start.set(start);
    this.end.set(addMinutes(start, DEFAULT_DURATION_MIN));
  }

  submit(event: Event) {
    event.preventDefault();
    const appointment = this.selected();
    const user = this.auth.user();
    if (!appointment || !user || appointment.carId === null || this.submitting()) return;

    this.submitting.set(true);
    this.message.set(null);
    this.testDrives
      .schedule({
        appointmentId: appointment.appointmentId,
        employeeId: user.id,
        carId: appointment.carId,
        scheduleStart: this.start(),
        scheduleEnd: this.end(),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.message.set({ text: `Test drive scheduled for ${appointment.clientName}.`, type: 'success' });
          this.selectedId.set(null);
          this.pending.reload();
          this.upcoming.reload();
        },
        error: (error: unknown) => this.message.set({ text: errorText(error), type: 'error' }),
      });
  }
}

/** Adds minutes to a "YYYY-MM-DDTHH:mm" value, in local time. */
export function addMinutes(value: string, minutes: number): string {
  const [date = '', time = ''] = value.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const result = new Date(y!, mo! - 1, d!, h!, mi! + minutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(result.getHours())}:${pad(result.getMinutes())}`;
}

function errorText(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Could not connect to the server.';
    if (typeof error.error?.error === 'string') return error.error.error;
  }
  return 'Could not schedule the test drive.';
}
