import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { AuthService } from '../../services/auth.service';
import { MANAGER_TABLES } from '../../models/manager-data.model';

interface ManagerTask {
  title: string;
  description: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-manager-home',
  imports: [RouterLink, SiteFooterComponent],
  templateUrl: './manager-home.component.html',
  styleUrl: './manager-home.component.css',
})
export default class ManagerHomeComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly tasks: ManagerTask[] = [
    { title: 'Appointments', description: 'Approve or reject appointments requested by customers.', icon: 'fa-calendar-check' },
    { title: 'Test drives', description: 'Manage and record test drive appointments.', icon: 'fa-car-side' },
    { title: 'Vehicle inspection', description: 'Inspect vehicles entering the agency.', icon: 'fa-clipboard-check' },
    { title: 'Register a purchase', description: 'Record cars bought from customers.', icon: 'fa-cart-arrow-down' },
    { title: 'Register a sale', description: 'Record cars sold to customers.', icon: 'fa-handshake' },
    { title: 'Documents', description: 'Verify the documents required for each transaction.', icon: 'fa-folder-open' },
    { title: 'Contracts', description: 'Generate the contract of an operation.', icon: 'fa-file-signature' },
    { title: 'Spare parts catalog', description: 'Search spare parts and manage their stock.', icon: 'fa-gears', route: '/spare-parts' },
    { title: 'Register a spare part', description: 'Add a spare part to the inventory.', icon: 'fa-circle-plus', route: '/spare-parts/register' },
    { title: 'Staff', description: 'View, search, register, and update staff accounts.', icon: 'fa-users', route: '/manager/staff' },
  ];

  protected readonly databaseTables = MANAGER_TABLES;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
