import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, finalize } from 'rxjs';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { AppointmentService } from '../../services/appointment.service';
import { SaleOfferService } from '../../services/sale-offer.service';
import { dateToInput, daysFromNow, inputToSql, isBusinessHours, sqlToDate, sqlToInput } from '../../utils/datetime';
import { apiErrorText, pillClass } from '../../utils/http-error';

interface Message {
  text: string;
  type: 'success' | 'error';
}

/** The customer may ask for up to 10% above the estimate (SaleOffers.controller.ts). */
const MAX_ABOVE_ESTIMATE = 1.1;

/**
 * Customer page reached through the "manage your appointment" link
 * (/appointments/:id/manage?token=...). Customers have no account: the token proves the
 * appointment is theirs. Covers ModifyAnAppointment, CancelAnAppointment and the listing
 * price of OfferMyCarForSale.
 */
@Component({
  selector: 'app-manage-appointment',
  imports: [CurrencyPipe, DatePipe, RouterLink, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './manage-appointment.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export class ManageAppointmentComponent {
  private readonly appointments = inject(AppointmentService);
  private readonly saleOffers = inject(SaleOfferService);

  /** Route parameter and query parameter (withComponentInputBinding). */
  readonly id = input.required<string>();
  readonly token = input<string>('');

  protected readonly appointmentId = computed(() => Number(this.id()));

  protected readonly appointment = rxResource({
    params: () => ({ id: this.appointmentId(), token: this.token() }),
    stream: ({ params }) =>
      Number.isInteger(params.id) && params.id > 0 && params.token
        ? this.appointments.getManaged(params.id, params.token)
        : EMPTY,
  });

  protected readonly linkIsValid = computed(() => this.appointmentId() > 0 && !!this.token());
  protected readonly notFound = computed(() => {
    const error = this.appointment.error();
    return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
  });

  protected readonly newDatetime = signal('');
  protected readonly cancelReason = signal('');
  protected readonly cancelConfirmed = signal(false);
  protected readonly listingPrice = signal<number | null>(null);
  protected readonly busy = signal(false);
  protected readonly message = signal<Message | null>(null);

  /** Same window the API accepts: from tomorrow up to 30 days from today. */
  protected readonly minDatetime = dateToInput(daysFromNow(1, 9));
  protected readonly maxDatetime = dateToInput(daysFromNow(30, 17));

  protected readonly maxListingPrice = computed(() => {
    const estimate = this.appointment.value()?.saleOffer?.estimatedPrice;
    return estimate ? Math.round(estimate * MAX_ABOVE_ESTIMATE * 100) / 100 : null;
  });

  protected readonly toDate = sqlToDate;
  protected readonly pillClass = pillClass;

  modify(event: Event) {
    event.preventDefault();
    const value = this.newDatetime();
    if (!value) return;
    if (!isBusinessHours(new Date(value))) {
      this.message.set({
        text: 'Please choose a time within business hours: Monday to Friday 9 AM–5 PM, Saturday 9 AM–3 PM.',
        type: 'error',
      });
      return;
    }
    this.send(
      this.appointments.modify(this.appointmentId(), this.token(), inputToSql(value)),
      'Your appointment was moved. It is pending again until the dealership confirms it.',
    );
  }

  cancel(event: Event) {
    event.preventDefault();
    if (!this.cancelConfirmed()) return;
    this.send(
      this.appointments.cancel(this.appointmentId(), this.token(), this.cancelReason().trim() || undefined),
      'Your appointment was cancelled.',
    );
  }

  changeListingPrice(event: Event) {
    event.preventDefault();
    const offer = this.appointment.value()?.saleOffer;
    const price = this.listingPrice();
    if (!offer || price === null) return;
    this.send(
      this.saleOffers.updateListingPrice(offer.tradeId, this.token(), price),
      'Your asking price was updated.',
    );
  }

  /** Pre-fills the forms with the current values. */
  startModify() {
    const current = this.appointment.value();
    if (current) this.newDatetime.set(sqlToInput(current.appointmentDatetime));
  }

  private send(request: Observable<unknown>, success: string) {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set(null);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => {
        this.message.set({ text: success, type: 'success' });
        this.newDatetime.set('');
        this.cancelConfirmed.set(false);
        this.listingPrice.set(null);
        this.appointment.reload();
      },
      error: (error: unknown) =>
        this.message.set({ text: apiErrorText(error, 'Something went wrong. Please try again.'), type: 'error' }),
    });
  }
}
