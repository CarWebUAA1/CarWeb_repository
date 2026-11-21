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
