import { Directive, ElementRef, inject } from '@angular/core';

export const CAR_PLACEHOLDER = '/assets/images/car-placeholder.svg';

/** Swaps an <img> for the placeholder when its photo fails to load (US-05). */
@Directive({
  selector: 'img[appImgFallback]',
  host: { '(error)': 'onError()' },
})
export class ImgFallbackDirective {
  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  onError() {
    // Guard so a missing placeholder cannot cause an endless error loop.
    if (!this.img.src.endsWith(CAR_PLACEHOLDER)) this.img.src = CAR_PLACEHOLDER;
  }
}
