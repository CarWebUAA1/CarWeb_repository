import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { QuickAccessSidebarComponent } from '../quick-access-sidebar/quick-access-sidebar.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';

/** Top bar: logo, search bar, Catalog and Log in buttons, and the quick access sidebar. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, SearchBarComponent, QuickAccessSidebarComponent],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
})
export class SiteHeaderComponent {
  private readonly router = inject(Router);

  // The catalog does not filter by this term yet: brand/model filtering is US-04.
  onSearch(term: string) {
    this.router.navigate(['/cars'], { queryParams: { search: term } });
  }
}
