import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../components/site-header/site-header.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './home.component.html',
  // Header on top, footer at the bottom, content fills the space in between.
  host: { class: 'flex min-h-dvh flex-col' },
})
export default class HomeComponent {}
