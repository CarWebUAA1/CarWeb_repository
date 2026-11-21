import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmployeeHeaderComponent } from '../../components/employee-header/employee-header.component';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { AuthService } from '../../services/auth.service';

interface EmployeeTask {
  title: string;
  description: string;
  icon: string;
  /** Page of the task; tasks without one are placeholders ("Coming soon"). */
  route?: string;
}

/** Home of the employee page. Reached only through the login (see employeeGuard). */
@Component({
  selector: 'app-employee-home',
  imports: [RouterLink, EmployeeHeaderComponent, SiteFooterComponent],
  templateUrl: './employee-home.component.html',
  styleUrl: './employee-home.component.css',
})
export default class EmployeeHomeComponent {
  protected readonly auth = inject(AuthService);

  // Employee user stories (Documentation/UserStories/Employee).
  protected readonly tasks: EmployeeTask[] = [
    { title: 'Appointments', description: 'Approve or reject appointments requested by customers.', icon: 'fa-calendar-check' },
    { title: 'Test drives', description: 'Schedule test drives and see the upcoming ones.', icon: 'fa-car-side', route: '/employee/test-drives' },
    { title: 'Vehicle inspection', description: 'Inspect vehicles entering the agency.', icon: 'fa-clipboard-check' },
    { title: 'Register a purchase', description: 'Record cars bought from customers.', icon: 'fa-cart-arrow-down' },
    { title: 'Register a sale', description: 'Record cars sold to customers.', icon: 'fa-handshake' },
    { title: 'Documents', description: 'Verify the documents required for each transaction.', icon: 'fa-folder-open' },
    { title: 'Contracts', description: 'Generate the contract of an operation.', icon: 'fa-file-signature' },
  ];
}
