import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortalHeaderComponent } from '../../components/portal-header/portal-header.component';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { AuthService } from '../../services/auth.service';
import { MANAGER_TABLES } from '../../models/manager-data.model';

interface ManagerTask {
  title: string;
  description: string;
  icon: string;
  route?: string;
  /** Text of the card's call to action; only for cards with a route. */
  action?: string;
}

@Component({
  selector: 'app-manager-home',
  imports: [RouterLink, PortalHeaderComponent, SiteFooterComponent],
  templateUrl: './manager-home.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export default class ManagerHomeComponent {
  protected readonly auth = inject(AuthService);

  protected readonly tasks: ManagerTask[] = [
    { title: 'Appointments', description: 'Approve or reject appointments requested by customers.', icon: 'fa-calendar-check', route: '/employee/appointments', action: 'Manage appointments' },
    { title: 'Test drives', description: 'See scheduled test drives (scheduling is done by employees).', icon: 'fa-car-side', route: '/employee/test-drives', action: 'View test drives' },
    { title: 'Car inventory', description: 'Add, edit, re-price and remove cars.', icon: 'fa-warehouse', route: '/manager/inventory', action: 'Manage inventory' },
    { title: 'Vehicle inspection', description: 'Inspect vehicles entering the agency.', icon: 'fa-clipboard-check' },
    { title: 'Register a purchase', description: 'Record cars bought from customers.', icon: 'fa-cart-arrow-down' },
    { title: 'Register a sale', description: 'Record cars sold to customers.', icon: 'fa-handshake' },
    { title: 'Documents', description: 'Verify the documents required for each transaction.', icon: 'fa-folder-open' },
    { title: 'Contracts', description: 'Generate the contract of an operation.', icon: 'fa-file-signature' },
    { title: 'Spare parts catalog', description: 'Search spare parts and manage their stock.', icon: 'fa-gears', route: '/spare-parts', action: 'Browse catalog' },
    { title: 'Register a spare part', description: 'Add a spare part to the inventory.', icon: 'fa-circle-plus', route: '/spare-parts/register', action: 'Register spare part' },
    { title: 'Staff', description: 'View, search, register, and update staff accounts.', icon: 'fa-users', route: '/manager/staff', action: 'Manage staff' },
  ];

  protected readonly databaseTables = MANAGER_TABLES;
}
