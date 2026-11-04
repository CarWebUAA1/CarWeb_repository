import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Bottom bar with the logo, placeholder link columns and the copyright notice. */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
})
export class SiteFooterComponent {
  protected readonly year = new Date().getFullYear();

  // Placeholder content until the real sections are defined.
  protected readonly columns = ['Company', 'Services', 'Support'].map((title) => ({
    title,
    links: ['Placeholder link', 'Placeholder link', 'Placeholder link'],
  }));
}
