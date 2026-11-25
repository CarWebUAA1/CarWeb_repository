import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import {
  CarOffer,
  CreateSaleOfferResponse,
  EstimateResponse,
  FUEL_TYPES,
  TRANSMISSIONS,
} from '../../models/sale-offer.model';
import { AppointmentService, manageLink } from '../../services/appointment.service';
import { SaleOfferService } from '../../services/sale-offer.service';
import { dateToInput, daysFromNow, inputToSql, isBusinessHours } from '../../utils/datetime';
import { apiErrorText } from '../../utils/http-error';

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png'];

interface PhotoPreview {
  name: string;
  dataUrl: string;
}

/** Checks the files picked by the customer. Returns the error to show, or null. */
export function checkPhotos(files: { type: string; size: number }[]): string | null {
  if (files.length < MIN_PHOTOS || files.length > MAX_PHOTOS) {
    return `Choose between ${MIN_PHOTOS} and ${MAX_PHOTOS} photos.`;
  }
  if (files.some((f) => !PHOTO_TYPES.includes(f.type))) return 'Photos must be JPG or PNG.';
  if (files.some((f) => f.size > MAX_PHOTO_BYTES)) return 'Each photo must be 5 MB or less.';
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Offer my car for sale (US-19). Customers have no account, so the request hangs from a
 * "Sale evaluation" appointment: step 1 books it (or reuses the one in the link), step 2
 * gets the estimate, step 3 sends the photos and accepts the estimate.
 */
@Component({
  selector: 'app-sell-my-car',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './sell-my-car.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export class SellMyCarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly appointments = inject(AppointmentService);
  private readonly saleOffers = inject(SaleOfferService);

  /** Query parameters of a manage link (withComponentInputBinding). */
  readonly appointment = input<string>('');
  readonly token = input<string>('');

  /** The "Sale evaluation" appointment the offer belongs to: from the link, or booked in step 1. */
  protected readonly appointmentId = linkedSignal(() => Number(this.appointment()) || null);
  protected readonly manageToken = linkedSignal(() => this.token() || null);
  protected readonly hasAppointment = computed(() => this.appointmentId() !== null && !!this.manageToken());

  protected readonly fuelTypes = FUEL_TYPES;
  protected readonly transmissions = TRANSMISSIONS;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly minDatetime = dateToInput(daysFromNow(1, 9));
  protected readonly maxDatetime = dateToInput(daysFromNow(30, 17));

  protected readonly contactForm = this.fb.nonNullable.group({
    clientName: ['', [Validators.required, Validators.maxLength(100)]],
    clientPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-()\s]{7,15}$/)]],
    clientEmail: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    appointmentDatetime: ['', Validators.required],
  });

  protected readonly carForm = this.fb.nonNullable.group({
    brand: ['', [Validators.required, Validators.maxLength(50)]],
    model: ['', [Validators.required, Validators.maxLength(50)]],
    year: [this.currentYear, [Validators.required, Validators.min(1990), Validators.max(this.currentYear)]],
    version: ['', [Validators.required, Validators.maxLength(50)]],
    mileage: [0, [Validators.required, Validators.min(1), Validators.max(1000000)]],
    fuelType: this.fb.nonNullable.control<CarOffer['fuelType']>('Gasoline'),
    transmission: this.fb.nonNullable.control<CarOffer['transmission']>('Automatic'),
    color: ['', [Validators.required, Validators.maxLength(30)]],
  });

  protected readonly vin = signal('');
  protected readonly photos = signal<PhotoPreview[]>([]);
  protected readonly photoError = signal<string | null>(null);
  protected readonly acceptEstimate = signal(false);

  protected readonly estimate = signal<EstimateResponse | null>(null);
  protected readonly result = signal<CreateSaleOfferResponse | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly vinIsValid = computed(() => /^[A-HJ-NPR-Z0-9]{17}$/i.test(this.vin().trim()));
  protected readonly canSubmit = computed(
    () => !!this.estimate() && this.vinIsValid() && this.photos().length >= MIN_PHOTOS && this.acceptEstimate(),
  );
  protected readonly manage = computed(() => {
    const id = this.appointmentId();
    const token = this.manageToken();
    return id && token ? manageLink(id, token) : null;
  });

  constructor() {
    // An estimate only holds for the data it was calculated with.
    this.carForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.estimate.set(null);
      this.acceptEstimate.set(false);
    });
  }

  bookEvaluation(event: Event) {
    event.preventDefault();
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    const data = this.contactForm.getRawValue();
    if (!isBusinessHours(new Date(data.appointmentDatetime))) {
      this.error.set('Please choose a time within business hours: Monday to Friday 9 AM–5 PM, Saturday 9 AM–3 PM.');
      return;
    }
    this.start();
    this.appointments
      .createAppointment({
        ...data,
        appointmentType: 'Sale evaluation',
        appointmentDatetime: inputToSql(data.appointmentDatetime),
        carId: null,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (response) => {
          const { appointmentId, manageToken } = response.data;
          this.appointmentId.set(appointmentId);
          this.manageToken.set(manageToken);
          // Keeps the appointment in the URL, so a reload does not lose it.
          this.router.navigate([], {
            queryParams: { appointment: appointmentId, token: manageToken },
            replaceUrl: true,
          });
        },
        error: (error: unknown) => this.error.set(apiErrorText(error, 'Could not book the evaluation. Please try again.')),
      });
  }

  getEstimate(event: Event) {
    event.preventDefault();
    if (this.carForm.invalid) {
      this.carForm.markAllAsTouched();
      return;
    }
    this.start();
    this.saleOffers
      .estimate(this.carOffer())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (estimate) => this.estimate.set(estimate),
        error: (error: unknown) => this.error.set(apiErrorText(error, 'Could not estimate your car. Please try again.')),
      });
  }

  async pickPhotos(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    const problem = checkPhotos(files);
    this.photoError.set(problem);
    if (problem) {
      this.photos.set([]);
      return;
    }
    try {
      const urls = await Promise.all(files.map(readAsDataUrl));
      this.photos.set(files.map((file, i) => ({ name: file.name, dataUrl: urls[i]! })));
    } catch {
      this.photoError.set('Could not read the photos. Please choose them again.');
    }
  }

  submitOffer() {
    const id = this.appointmentId();
    const token = this.manageToken();
    if (!this.canSubmit() || !id || !token) return;
    this.start();
    this.saleOffers
      .create({
        ...this.carOffer(),
        appointmentId: id,
        token,
        vin: this.vin().trim().toUpperCase(),
        photos: this.photos().map((p) => p.dataUrl),
        acceptEstimate: true,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => this.error.set(apiErrorText(error, 'Could not send your offer. Please try again.')),
      });
  }

  private carOffer(): CarOffer {
    const car = this.carForm.getRawValue();
    return { ...car, year: Number(car.year), mileage: Number(car.mileage) };
  }

  private start() {
    this.busy.set(true);
    this.error.set(null);
  }
}
