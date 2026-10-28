import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CAR_PLACEHOLDER, ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { CarSummary } from '../../models/car.model';

@Component({
  selector: 'app-car-card',
  imports: [RouterLink, CurrencyPipe, DecimalPipe, ImgFallbackDirective],
  templateUrl: './car-card.component.html',
  styleUrl: './car-card.component.css',
})
export class CarCardComponent {
  readonly car = input.required<CarSummary>();
  protected readonly placeholder = CAR_PLACEHOLDER;
}
