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
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
