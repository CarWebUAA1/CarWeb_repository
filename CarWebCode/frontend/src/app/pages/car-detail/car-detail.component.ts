
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../components/button/button.component';
import { CAR_PLACEHOLDER, ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { CarService } from '../../services/car.service';
import { AppointmentService, manageLink } from '../../services/appointment.service';
import { AppointmentModalComponent } from '../../components/appointment-modal/appointment-modal.component';
import { CreateAppointment } from '../../models/appointment.model';
import { finalize } from 'rxjs';
import { apiErrorText } from '../../utils/http-error';

/** How often the page re-checks that the car is still available. */
const AVAILABILITY_CHECK_MS = 30_000;

@Component({
  selector: 'app-car-detail',
  imports: [
    SiteHeaderComponent,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    ButtonComponent,
    ImgFallbackDirective,
    AppointmentModalComponent
  ],
  templateUrl: './car-detail.component.html',
})
export class CarDetailComponent {
  private readonly carService = inject(CarService);
  private readonly appointmentService = inject(AppointmentService);

  /** Route parameter bound by the router. */
  readonly id = input.required<string>();

  protected readonly placeholder = CAR_PLACEHOLDER;

  protected readonly car = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.carService.getCar(id),
  });

  /** Index of the photo shown large. */
  protected readonly selectedPhoto = linkedSignal({
    source: () => this.car.value()?.id,
    computation: () => 0,
  });

  protected readonly mainPhotoUrl = computed(() => {
    const photos = this.car.value()?.photos ?? [];
    return photos[this.selectedPhoto()]?.url ?? this.placeholder;
  });

  // Controls whether the appointment modal is open.
  protected readonly appointmentModalOpen = signal(false);

  // Tracks whether an appointment request is being processed.
  protected readonly appointmentSubmitting = signal(false);

  // Displays the result of the appointment request.
  protected readonly appointmentMessage = signal('');

  // Link to the page where the customer can change or cancel the appointment just booked.
  protected readonly appointmentLink = signal<ReturnType<typeof manageLink> | null>(null);

  // Opens the appointment modal.
  protected openModal(): void {
    this.appointmentMessage.set('');
    this.appointmentLink.set(null);
    this.appointmentModalOpen.set(true);
  }

  // Closes the appointment modal.
  protected closeModal(): void {
    this.appointmentModalOpen.set(false);
  }

  // Sends the appointment request to the backend.
  protected submitAppointment(data: CreateAppointment): void {
  const currentCar = this.car.value();

  if (!currentCar || this.appointmentSubmitting()) return;

  this.appointmentSubmitting.set(true);

  this.appointmentService.createAppointment({
    ...data,
    carId: currentCar.id
  })
  .pipe(
    finalize(() => this.appointmentSubmitting.set(false))
  )
  .subscribe({
    next: (response) => {
      this.appointmentMessage.set(
        `Your appointment request was created successfully. Reference: ${response.data.appointmentId}`
      );
      this.appointmentLink.set(manageLink(response.data.appointmentId, response.data.manageToken));
      this.closeModal();
    },
    error: (error: unknown) => {
      this.appointmentMessage.set(
        apiErrorText(error, 'Unable to create the appointment. Please try again.')
      );
    }
  });
}

  constructor() {
    // Re-fetch periodically so the user is warned if the car is sold or reserved meanwhile.
    const timer = setInterval(() => this.car.reload(), AVAILABILITY_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
