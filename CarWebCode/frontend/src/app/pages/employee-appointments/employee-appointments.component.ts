import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { PortalHeaderComponent } from '../../components/portal-header/portal-header.component';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import type { AppointmentStatus, StaffAppointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { dateToInput, daysFromNow, inputToSql, isBusinessHours, sqlToDate, sqlToInput } from '../../utils/datetime';
import { apiErrorText, pillClass } from '../../utils/http-error';

type Filter = 'Pending' | 'Confirmed' | 'All';
/** An action that needs more data before it is sent (a reason or a new date). */
type PendingAction = { kind: 'reject' | 'cancel' | 'reschedule'; appointment: StaffAppointment };

interface Message {
  text: string;
  type: 'success' | 'error';
}

/** Only these statuses take a slot and can still change. */
const ACTIVE: AppointmentStatus[] = ['Pending', 'Confirmed'];

/** Staff page to confirm, reject, cancel and reschedule customer appointments (ApproveAppointmentsForClients). */
@Component({
  selector: 'app-employee-appointments',
  imports: [DatePipe, RouterLink, PortalHeaderComponent, SiteFooterComponent],
  templateUrl: './employee-appointments.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export default class EmployeeAppointmentsComponent {
  private readonly appointments = inject(AppointmentService);
  protected readonly auth = inject(AuthService);

  protected readonly list = rxResource({ stream: () => this.appointments.listAll() });

  protected readonly filters: Filter[] = ['Pending', 'Confirmed', 'All'];
  protected readonly filter = signal<Filter>('Pending');
  protected readonly search = signal('');

  protected readonly visible = computed(() => {
    const filter = this.filter();
    const query = this.search().trim().toLowerCase();
    const rows = (this.list.value() ?? []).filter((a) => filter === 'All' || a.status === filter);
    const filtered = query
      ? rows.filter((a) =>
          [a.clientName, a.clientEmail, a.clientPhone, a.car ?? '', String(a.appointmentId)]
            .some((value) => value.toLowerCase().includes(query)),
        )
      : rows;
    // Pending and confirmed: the closest first. All: as the API sends them (newest first).
    return filter === 'All'
      ? filtered
      : [...filtered].sort((a, b) => a.appointmentDatetime.localeCompare(b.appointmentDatetime));
  });

  protected readonly counts = computed(() => {
    const rows = this.list.value() ?? [];
    return {
      Pending: rows.filter((a) => a.status === 'Pending').length,
      Confirmed: rows.filter((a) => a.status === 'Confirmed').length,
      All: rows.length,
    } satisfies Record<Filter, number>;
  });

  protected readonly action = signal<PendingAction | null>(null);
  protected readonly reason = signal('');
  protected readonly newDatetime = signal('');
  protected readonly busyId = signal<number | null>(null);
  protected readonly message = signal<Message | null>(null);

  /** The staff API accepts dates from now up to 30 days ahead. */
  protected readonly minDatetime = dateToInput(new Date());
  protected readonly maxDatetime = dateToInput(daysFromNow(30, 23));

  protected readonly toDate = sqlToDate;
  protected readonly pillClass = pillClass;
  protected readonly isActive = (a: StaffAppointment) => ACTIVE.includes(a.status);
  protected readonly homeLink = computed(() => (this.auth.isManager() ? '/manager' : '/employee'));

  confirm(appointment: StaffAppointment) {
    this.run(
      appointment,
      this.appointments.updateStatus(appointment.appointmentId, 'Confirmed'),
      `Appointment #${appointment.appointmentId} confirmed. You are now its responsible employee.`,
    );
  }

  open(kind: PendingAction['kind'], appointment: StaffAppointment) {
    this.message.set(null);
    this.reason.set('');
    this.newDatetime.set(sqlToInput(appointment.appointmentDatetime));
    this.action.set({ kind, appointment });
  }

  closeAction() {
    this.action.set(null);
  }

  submitAction(event: Event) {
    event.preventDefault();
    const action = this.action();
    if (!action) return;
    const { appointment } = action;
    const id = appointment.appointmentId;

    if (action.kind === 'reschedule') {
      const value = this.newDatetime();
      if (!value || !isBusinessHours(new Date(value))) {
        this.message.set({
          text: 'Choose a time within business hours: Monday to Friday 9 AM–5 PM, Saturday 9 AM–3 PM.',
          type: 'error',
        });
        return;
      }
      this.run(appointment, this.appointments.reschedule(id, inputToSql(value)), `Appointment #${id} rescheduled.`);
      return;
    }

    const reason = this.reason().trim();
    if (!reason) {
      this.message.set({ text: 'Please write the reason.', type: 'error' });
      return;
    }
    const status = action.kind === 'reject' ? 'Rejected' : 'Cancelled';
    this.run(
      appointment,
      this.appointments.updateStatus(id, status, reason),
      `Appointment #${id} ${status.toLowerCase()}.`,
    );
  }

  private run(appointment: StaffAppointment, request: Observable<unknown>, success: string) {
    if (this.busyId() !== null) return;
    this.busyId.set(appointment.appointmentId);
    this.message.set(null);
    request.pipe(finalize(() => this.busyId.set(null))).subscribe({
      next: () => {
        this.message.set({ text: success, type: 'success' });
        this.action.set(null);
        this.list.reload();
      },
      error: (error: unknown) =>
        this.message.set({ text: apiErrorText(error, 'Could not save the change. Please try again.'), type: 'error' }),
    });
  }
}
