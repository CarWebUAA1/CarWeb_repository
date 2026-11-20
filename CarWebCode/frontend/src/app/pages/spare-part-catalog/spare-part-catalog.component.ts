import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';
import { SparePartService } from '../../services/spare-part.service';

@Component({
  selector: 'app-spare-part-catalog',
  imports: [SiteHeaderComponent, RouterLink, CurrencyPipe],
  templateUrl: './spare-part-catalog.component.html',
  styleUrl: './spare-part-catalog.component.css',
})
export class SparePartCatalogComponent {
  private readonly sparePartService = inject(SparePartService);

  readonly page = input<string>();
  readonly search = input<string>();

  protected readonly currentPage = computed(() => {
    const parsed = Number(this.page());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  });
  protected readonly searchTerm = computed(() => this.search()?.trim() ?? '');

  protected readonly spareParts = rxResource({
    params: () => ({ page: this.currentPage(), search: this.searchTerm() }),
    stream: ({ params }) => this.sparePartService.getSpareParts(params.page, params.search),
  });
}
