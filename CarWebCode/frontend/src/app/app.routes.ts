import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'cars',
    title: 'Catálogo | CarWeb',
    loadComponent: () =>
      import('./pages/car-catalog/car-catalog.component').then((m) => m.CarCatalogComponent),
  },
  {
    path: 'cars/:id',
    title: 'Detalle del auto | CarWeb',
    loadComponent: () =>
      import('./pages/car-detail/car-detail.component').then((m) => m.CarDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
