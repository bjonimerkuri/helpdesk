import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Helpdesk',
    loadComponent: () => import('./features/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Tickets · Helpdesk',
        loadComponent: () => import('./features/ticket-list.component').then((m) => m.TicketListComponent),
      },
      {
        path: 'tickets/new',
        title: 'New ticket · Helpdesk',
        loadComponent: () => import('./features/ticket-form.component').then((m) => m.TicketFormComponent),
      },
      {
        path: 'tickets/:id',
        title: 'Ticket · Helpdesk',
        loadComponent: () => import('./features/ticket-detail.component').then((m) => m.TicketDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
