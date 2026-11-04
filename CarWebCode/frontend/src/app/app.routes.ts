import { Routes } from '@angular/router';

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
    path: 'register',
    title: 'Sign up | CarWeb',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'login',
    title: 'Log in | CarWeb',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '**', redirectTo: '' },
];
