import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { AuthService } from '../../services/auth.service';

interface EmployeeTask {
  title: string;
  description: string;
  icon: string;
}

/** Home of the employee page. Reached only through the login (see employeeGuard). */
@Component({
  selector: 'app-employee-home',
  imports: [RouterLink, SiteFooterComponent],
  templateUrl: './employee-home.component.html',
  styleUrl: './employee-home.component.css',
})
export default class EmployeeHomeComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  // Placeholders for the employee user stories (Documentation/UserStories/Employee).
  protected readonly tasks: EmployeeTask[] = [
    { title: 'Appointments', description: 'Approve or reject appointments requested by customers.', icon: 'fa-calendar-check' },
    { title: 'Test drives', description: 'Manage and record test drive appointments.', icon: 'fa-car-side' },
    { title: 'Vehicle inspection', description: 'Inspect vehicles entering the agency.', icon: 'fa-clipboard-check' },
    { title: 'Register a purchase', description: 'Record cars bought from customers.', icon: 'fa-cart-arrow-down' },
    { title: 'Register a sale', description: 'Record cars sold to customers.', icon: 'fa-handshake' },
    { title: 'Documents', description: 'Verify the documents required for each transaction.', icon: 'fa-folder-open' },
    { title: 'Contracts', description: 'Generate the contract of an operation.', icon: 'fa-file-signature' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
