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
    path: 'manager',
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
