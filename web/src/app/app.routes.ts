import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/ticket-list.component').then((m) => m.TicketListComponent),
      },
      {
        path: 'tickets/new',
        loadComponent: () => import('./features/ticket-form.component').then((m) => m.TicketFormComponent),
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/ticket-detail.component').then((m) => m.TicketDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
