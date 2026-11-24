import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Top bar of the employee page: logo, "Employee portal" badge, the user's name and Log out. */
@Component({
  selector: 'app-employee-header',
  imports: [RouterLink],
  templateUrl: './employee-header.component.html',
  styleUrl: './employee-header.component.css',
})
export class EmployeeHeaderComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
