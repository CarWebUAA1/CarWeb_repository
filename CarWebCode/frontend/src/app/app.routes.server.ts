import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The catalog shows live data from the API, so it renders in the browser
  // instead of being prerendered at build time.
  {
    path: 'cars',
    renderMode: RenderMode.Client
  },
  {
    path: 'cars/:id',
    renderMode: RenderMode.Client
  },
  // Depends on the session saved in the browser, which the server cannot see.
  {
    path: 'employee',
    renderMode: RenderMode.Client
  },
  {
    path: 'employee/profile',
    renderMode: RenderMode.Client
  },
  {
    path: 'manager/staff',
    renderMode: RenderMode.Client
  },
  {
    path: 'employee/appointments',
    renderMode: RenderMode.Client
  },
  {
    path: 'employee/test-drives',
    renderMode: RenderMode.Client
  },
  {
    path: 'manager',
    renderMode: RenderMode.Client
  },
  {
    path: 'manager/inventory',
    renderMode: RenderMode.Client
  },
  // Customer pages: they read the token from the link, which only the browser has.
  {
    path: 'appointments/:id/manage',
    renderMode: RenderMode.Client
  },
  {
    path: 'sell-my-car',
    renderMode: RenderMode.Client
  },
  {
    path: 'manager/data/:table',
    renderMode: RenderMode.Client
  },
  {
    path: 'spare-parts',
    renderMode: RenderMode.Client
  },
  {
    path: 'spare-parts/register',
    renderMode: RenderMode.Client
  },
  {
    path: 'spare-parts/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
