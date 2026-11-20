import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { QuickAccessSidebarComponent } from '../quick-access-sidebar/quick-access-sidebar.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';

/** Top bar: logo, search bar, Catalog and employee access buttons, and the quick access sidebar. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, SearchBarComponent, QuickAccessSidebarComponent],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
})
export class SiteHeaderComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected get isSparePartsCatalog(): boolean {
    return this.router.url.startsWith('/spare-parts');
  }

  onSearch(term: string) {
    const catalog = this.isSparePartsCatalog ? '/spare-parts' : '/cars';
    this.router.navigate([catalog], { queryParams: { search: term } });
  }
}
