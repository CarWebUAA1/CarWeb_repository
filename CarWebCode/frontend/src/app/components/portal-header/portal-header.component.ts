import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export type Portal = 'employee' | 'manager';

/** Top bar of the staff portals: logo, portal badge, the user's name and Log out. */
@Component({
  selector: 'app-portal-header',
  imports: [RouterLink],
  templateUrl: './portal-header.component.html',
})
export class PortalHeaderComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  /** Which portal the page belongs to: sets the badge text and where the logo leads. */
  readonly portal = input<Portal>('employee');

  protected readonly label = computed(() => (this.portal() === 'manager' ? 'Manager' : 'Employee'));
  protected readonly homeLink = computed(() => `/${this.portal()}`);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
