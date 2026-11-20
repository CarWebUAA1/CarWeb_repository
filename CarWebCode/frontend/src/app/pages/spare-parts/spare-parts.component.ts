import { Component, inject, signal } from "@angular/core";

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";

import { SparePartService } from "../../services/spare-part.service";
import type { CreateSparePart } from "../../models/spare-part.model";
import { SiteHeaderComponent } from "../../components/site-header/site-header.component";

import { finalize } from "rxjs";

@Component({
  selector: "app-spare-parts",
  standalone: true,
  imports: [ReactiveFormsModule, SiteHeaderComponent],
  templateUrl: "./spare-parts.component.html",
  styleUrl: "./spare-parts.component.css"
})
export class SparePartsComponent {

  private readonly fb = inject(FormBuilder);
  private readonly sparePartService = inject(SparePartService);

  message = signal("");
  messageType = signal<"success" | "error" | "">("");
  loading = signal(false);

  sparePartForm = this.fb.group({
    carId: [""],

    brand: ["", [
      Validators.required,
      Validators.maxLength(50)
    ]],

    model: ["", [
      Validators.required,
      Validators.maxLength(50)
    ]],

    price: [null as number | null, [
      Validators.required,
      Validators.min(0.01)
    ]]
  });

  registerSparePart(): void {

    if (this.sparePartForm.invalid) {
      this.sparePartForm.markAllAsTouched();

      this.message.set(
        "Please complete all required fields correctly."
      );

      this.messageType.set("error");
      return;
    }

    const formValue = this.sparePartForm.getRawValue();

    const sparePart: CreateSparePart = {
      carId: formValue.carId
        ? Number(formValue.carId)
        : null,

      brand: formValue.brand!.trim(),
      model: formValue.model!.trim(),
      price: Number(formValue.price)
    };

    this.loading.set(true);
    this.message.set("");
    this.messageType.set("");

    this.sparePartService
      .createSparePart(sparePart)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({

        next: (response) => {
          this.message.set(response.message);
          this.messageType.set("success");

          this.sparePartForm.reset({
            carId: "",
            brand: "",
            model: "",
            price: null
          });
        },

        error: (error) => {
          console.error(
            "Error registering spare part:",
            error
          );

          this.message.set(
            error.error?.error ||
            error.error?.message ||
            "Could not register spare part."
          );

          this.messageType.set("error");
        }

      });
  }
}
