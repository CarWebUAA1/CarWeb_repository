import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import {
  CAR_STATUSES,
  CarStatus,
  InventoryCar,
  InventoryCarRequest,
  TIRE_CONDITIONS,
  TireCondition,
} from '../../models/inventory.model';
import { FUEL_TYPES, FuelType, TRANSMISSIONS, Transmission } from '../../models/sale-offer.model';
import { InventoryService } from '../../services/inventory.service';
import { apiErrorText, pillClass } from '../../utils/http-error';

interface Message {
  text: string;
  type: 'success' | 'error';
}

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;
const emptyToNull = (value: string) => (value.trim() ? value.trim() : null);

/** Manager page to add, edit, re-price and delete cars (RegisterAndUpdateInventory). */
@Component({
  selector: 'app-manager-inventory',
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule, RouterLink, SiteFooterComponent],
  templateUrl: './manager-inventory.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export class ManagerInventoryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly inventory = inject(InventoryService);

  protected readonly statuses = CAR_STATUSES;
  protected readonly tireConditions = TIRE_CONDITIONS;
  protected readonly fuelTypes = FUEL_TYPES;
  protected readonly transmissions = TRANSMISSIONS;
  protected readonly maxYear = new Date().getFullYear() + 1;
  protected readonly pillClass = pillClass;

  protected readonly includeOutOfStock = signal(false);
  protected readonly cars = rxResource({
    params: () => this.includeOutOfStock(),
    stream: ({ params }) => this.inventory.list(params),
  });

  protected readonly search = signal('');
  protected readonly statusFilter = signal<CarStatus | ''>('');
  protected readonly visible = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return (this.cars.value() ?? []).filter(
      (car) =>
        (!status || car.status === status) &&
        (!query ||
          [car.brand, car.model, car.vin, car.plates ?? '', String(car.carId), String(car.year)]
            .some((value) => value.toLowerCase().includes(query))),
    );
  });

  /** null: list only; 'new': adding a car; a car: editing it. */
  protected readonly editing = signal<InventoryCar | 'new' | null>(null);
  protected readonly pricing = signal<InventoryCar | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly newPrice = signal<number | null>(null);
  protected readonly confirmLowerPrice = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<Message | null>(null);

  protected readonly carForm = this.fb.nonNullable.group({
    vin: ['', [Validators.required, Validators.pattern(VIN_PATTERN)]],
    plates: ['', Validators.maxLength(10)],
    brand: ['', [Validators.required, Validators.maxLength(50)]],
    model: ['', [Validators.required, Validators.maxLength(50)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1990), Validators.max(this.maxYear)]],
    version: ['', Validators.maxLength(50)],
    series: ['', Validators.maxLength(50)],
    mileage: [0, [Validators.required, Validators.min(0), Validators.max(1000000)]],
    fuelType: this.fb.nonNullable.control<FuelType>('Gasoline'),
    transmission: this.fb.nonNullable.control<Transmission>('Automatic'),
    color: ['', [Validators.required, Validators.maxLength(30)]],
    tireCondition: this.fb.nonNullable.control<TireCondition | ''>(''),
    serviceHistory: ['', Validators.maxLength(5000)],
    purchasePrice: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    basePrice: this.fb.control<number | null>(null, Validators.min(0.01)),
    salePrice: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    testDriveAuthorized: true,
    status: this.fb.nonNullable.control<CarStatus>('Available'),
    confirmLowerSalePrice: false,
  });

  private readonly formValue = toSignal(this.carForm.valueChanges, { initialValue: this.carForm.getRawValue() });
  /** The story asks for a confirmation when the car would sell below what it cost. */
  protected readonly saleBelowPurchase = computed(() => {
    const { purchasePrice, salePrice } = this.formValue();
    return purchasePrice != null && salePrice != null && salePrice < purchasePrice;
  });
  protected readonly priceBelowPurchase = computed(() => {
    const car = this.pricing();
    const price = this.newPrice();
    return !!car && car.purchasePrice !== null && price !== null && price < car.purchasePrice;
  });

  beginCreate() {
    this.closePanels();
    this.carForm.reset();
    this.editing.set('new');
  }

  beginEdit(car: InventoryCar) {
    this.closePanels();
    this.carForm.reset({
      vin: car.vin,
      plates: car.plates ?? '',
      brand: car.brand,
      model: car.model,
      year: car.year,
      version: car.version ?? '',
      series: car.series ?? '',
      mileage: car.mileage,
      fuelType: car.fuelType,
      transmission: car.transmission,
      color: car.color,
      tireCondition: car.tireCondition ?? '',
      serviceHistory: car.serviceHistory ?? '',
      purchasePrice: car.purchasePrice,
      basePrice: car.basePrice,
      salePrice: car.salePrice,
      testDriveAuthorized: car.testDriveAuthorized,
      status: car.status,
      confirmLowerSalePrice: false,
    });
    this.editing.set(car);
  }

  beginPrice(car: InventoryCar) {
    this.closePanels();
    this.newPrice.set(car.salePrice);
    this.confirmLowerPrice.set(false);
    this.pricing.set(car);
  }

  closePanels() {
    this.editing.set(null);
    this.pricing.set(null);
    this.deletingId.set(null);
    this.message.set(null);
  }

  saveCar(event: Event) {
    event.preventDefault();
    const editing = this.editing();
    if (!editing) return;
    if (this.carForm.invalid) {
      this.carForm.markAllAsTouched();
      return;
    }
    const form = this.carForm.getRawValue();
    if (this.saleBelowPurchase() && !form.confirmLowerSalePrice) {
      this.message.set({ text: 'Confirm that the sale price can be lower than the purchase price.', type: 'error' });
      return;
    }
    const car: InventoryCarRequest = {
      vin: form.vin.trim().toUpperCase(),
      plates: emptyToNull(form.plates),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      version: emptyToNull(form.version),
      series: emptyToNull(form.series),
      mileage: Number(form.mileage),
      fuelType: form.fuelType,
      transmission: form.transmission,
      color: form.color.trim(),
      tireCondition: form.tireCondition || null,
      serviceHistory: emptyToNull(form.serviceHistory),
      purchasePrice: Number(form.purchasePrice),
      basePrice: form.basePrice === null ? null : Number(form.basePrice),
      salePrice: Number(form.salePrice),
      testDriveAuthorized: form.testDriveAuthorized,
      status: form.status,
      confirmLowerSalePrice: form.confirmLowerSalePrice,
    };
    const isNew = editing === 'new';
    this.save(
      isNew ? this.inventory.create(car) : this.inventory.update(editing.carId, car),
      isNew ? `${car.brand} ${car.model} was added to the inventory.` : `Car #${editing.carId} was updated.`,
    );
  }

  savePrice(event: Event) {
    event.preventDefault();
    const car = this.pricing();
    const price = this.newPrice();
    if (!car || price === null || price <= 0) return;
    if (this.priceBelowPurchase() && !this.confirmLowerPrice()) return;
    this.save(
      this.inventory.updatePrice(car.carId, price, this.confirmLowerPrice()),
      `The sale price of car #${car.carId} was updated.`,
    );
  }

  remove(car: InventoryCar) {
    this.save(this.inventory.remove(car.carId), `Car #${car.carId} was taken out of the inventory.`);
  }

  private save(request: Observable<unknown>, success: string) {
    if (this.saving()) return;
    this.saving.set(true);
    this.message.set(null);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.editing.set(null);
        this.pricing.set(null);
        this.deletingId.set(null);
        this.message.set({ text: success, type: 'success' });
        this.cars.reload();
      },
      error: (error: unknown) =>
        this.message.set({ text: apiErrorText(error, 'Could not save the change. Please try again.'), type: 'error' }),
    });
  }
}
