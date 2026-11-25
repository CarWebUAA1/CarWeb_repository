import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuickLink {
  label: string;
  /** Route of the page; links without one are placeholders for pages not built yet. */
  route?: string;
}

/** Menu button that opens a side panel with shortcuts to the main pages. */
@Component({
  selector: 'app-quick-access-sidebar',
  imports: [RouterLink],
  templateUrl: './quick-access-sidebar.component.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class QuickAccessSidebarComponent {
  private readonly injector = inject(Injector);
  private readonly toggleButton = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  protected readonly isOpen = signal(false);

  protected readonly links: QuickLink[] = [
    { label: 'Home', route: '/' },
    { label: 'Catalog', route: '/cars' },
    { label: 'Spare parts', route: '/spare-parts' },
    { label: 'Sell my car', route: '/sell-my-car' },
    // Customers have no account: they manage each appointment with the link they get when booking it.
    { label: 'Employee access', route: '/login' },
  ];

  open() {
    this.isOpen.set(true);
    afterNextRender(() => this.closeButton()?.nativeElement.focus(), { injector: this.injector });
  }

  close() {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.toggleButton().nativeElement.focus();
  }
}
