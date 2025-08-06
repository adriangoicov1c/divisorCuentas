import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./view-evento/view-evento.page').then((m) => m.ViewEventoPage),
  },
  {
    path: 'participantes/:eventoId',
    loadComponent: () => import('./participantes/participantes.page').then(m => m.ParticipantesPage),
  },
  {
    path: 'items/:eventoId',
    loadComponent: () => import('./items/items.page').then(m => m.ItemsPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

