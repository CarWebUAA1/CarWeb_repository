import { Routes } from '@angular/router';
import { employeeGuard } from './guards/employee.guard';
import { managerGuard } from './guards/manager.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component'),
  },
  {
    path: 'cars',
    title: 'Catalog | CarWeb',
    loadComponent: () =>
      import('./pages/car-catalog/car-catalog.component').then((m) => m.CarCatalogComponent),
  },
  {
    path: 'cars/:id',
    title: 'Car details | CarWeb',
    loadComponent: () =>
      import('./pages/car-detail/car-detail.component').then((m) => m.CarDetailComponent),
  },
  {
    path: 'sell-my-car',
    title: 'Sell your car | CarWeb',
    loadComponent: () =>
      import('./pages/sell-my-car/sell-my-car.component').then((m) => m.SellMyCarComponent),
  },
  {
    // Reached through the link given when the appointment is booked (?token=...).
    path: 'appointments/:id/manage',
    title: 'Your appointment | CarWeb',
    loadComponent: () =>
      import('./pages/manage-appointment/manage-appointment.component')
        .then((m) => m.ManageAppointmentComponent),
  },
  {
    path: 'login',
    title: 'Log in | CarWeb',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'employee',
    title: 'Employee portal | CarWeb',
    canActivate: [employeeGuard],
    loadComponent: () => import('./pages/employee-home/employee-home.component'),
  },
  {
    path: 'employee/profile',
    title: 'My profile | CarWeb',
    canActivate: [employeeGuard],
    loadComponent: () => import('./pages/employee-profile/employee-profile.component')
      .then((m) => m.EmployeeProfileComponent),
  },
  {
    path: 'employee/appointments',
    title: 'Appointments | CarWeb',
    canActivate: [employeeGuard],
    loadComponent: () => import('./pages/employee-appointments/employee-appointments.component'),
  },
  {
    path: 'employee/test-drives',
    title: 'Test drives | CarWeb',
    canActivate: [employeeGuard],
    loadComponent: () => import('./pages/employee-test-drives/employee-test-drives.component'),
  },
  {
    path: 'manager',
    title: 'Manager portal | CarWeb',
    canActivate: [managerGuard],
    loadComponent: () => import('./pages/manager-home/manager-home.component'),
  },
  {
    path: 'manager/staff',
    title: 'Staff management | CarWeb',
    canActivate: [managerGuard],
    loadComponent: () => import('./pages/staff-management/staff-management.component')
      .then((m) => m.StaffManagementComponent),
  },
  {
    path: 'manager/inventory',
    title: 'Car inventory | CarWeb',
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./pages/manager-inventory/manager-inventory.component')
        .then((m) => m.ManagerInventoryComponent),
  },
  {
    path: 'manager/data/:table',
    title: 'Database records | CarWeb',
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./pages/manager-table/manager-table.component')
        .then((m) => m.ManagerTableComponent),
  },
  {
    path: 'spare-parts',
    title: 'Spare parts catalog | CarWeb',
    loadComponent: () =>
      import('./pages/spare-part-catalog/spare-part-catalog.component')
        .then((m) => m.SparePartCatalogComponent),
  },
  {
    path: 'spare-parts/register',
    canActivate: [managerGuard],
    title: 'Register spare parts | CarWeb',
    loadComponent: () =>
      import('./pages/spare-parts/spare-parts.component')
        .then((m) => m.SparePartsComponent),
  },
  {
    path: 'spare-parts/:id',
    title: 'Spare part details | CarWeb',
    loadComponent: () =>
      import('./pages/spare-part-detail/spare-part-detail.component')
        .then((m) => m.SparePartDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
