import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="nav">
      <a routerLink="/"><b>Helpdesk</b></a>
      @if (auth.user(); as user) {
        <span>{{ user.email }} ({{ user.role }})</span>
        <button (click)="auth.logout()">Log out</button>
      }
    </header>
    <main><router-outlet /></main>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
