import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'register',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: 'asistente',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
