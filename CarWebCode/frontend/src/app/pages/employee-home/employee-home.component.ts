import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortalHeaderComponent } from '../../components/portal-header/portal-header.component';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { AuthService } from '../../services/auth.service';

interface EmployeeTask {
  title: string;
  description: string;
  icon: string;
  route?: string;
  /** Text of the card's call to action; only for cards with a route. */
  action?: string;
}

/** Home of the employee page. Reached only through the login (see employeeGuard). */
@Component({
  selector: 'app-employee-home',
  imports: [RouterLink, PortalHeaderComponent, SiteFooterComponent],
  templateUrl: './employee-home.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export default class EmployeeHomeComponent {
  protected readonly auth = inject(AuthService);

  // Placeholders for the employee user stories (Documentation/UserStories/Employee).
  protected readonly tasks: EmployeeTask[] = [
    { title: 'My profile', description: 'Update your personal information and password.', icon: 'fa-user-pen', route: '/employee/profile', action: 'Open profile' },
    { title: 'Appointments', description: 'Approve or reject appointments requested by customers.', icon: 'fa-calendar-check', route: '/employee/appointments', action: 'Manage appointments' },
    { title: 'Test drives', description: 'Manage and record test drive appointments.', icon: 'fa-car-side', route: '/employee/test-drives', action: 'Schedule test drives' },
    { title: 'Vehicle inspection', description: 'Inspect vehicles entering the agency.', icon: 'fa-clipboard-check' },
    { title: 'Register a purchase', description: 'Record cars bought from customers.', icon: 'fa-cart-arrow-down' },
    { title: 'Register a sale', description: 'Record cars sold to customers.', icon: 'fa-handshake' },
    { title: 'Documents', description: 'Verify the documents required for each transaction.', icon: 'fa-folder-open' },
    { title: 'Contracts', description: 'Generate the contract of an operation.', icon: 'fa-file-signature' },
    { title: 'Spare parts catalog', description: 'Search spare parts and record stock movements.', icon: 'fa-gears', route: '/spare-parts', action: 'Browse catalog' },
  ];
}
