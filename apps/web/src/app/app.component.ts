import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ROLE_LABEL } from './core/labels';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <header class="topbar">
      <a class="brand" routerLink="/" aria-label="Helpdesk home">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#0e5a6b" />
          <path d="M9 11.5h14v8.5H17l-4 3.5V20H9z" fill="#fff" />
        </svg>
        Helpdesk
      </a>
      @if (auth.user(); as user) {
        <span class="who"><strong>{{ user.email }}</strong> · {{ roleLabel[user.role] }}</span>
        <button type="button" class="quiet" (click)="auth.logout()">Log out</button>
      }
    </header>
    <main id="main" tabindex="-1"><router-outlet /></main>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly roleLabel = ROLE_LABEL;
}
