import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/errors';

const DEMO_PASSWORD = 'password123';
const DEMOS = [
  { label: 'Customer', email: 'customer@example.com' },
  { label: 'Agent', email: 'agent@example.com' },
  { label: 'Admin', email: 'admin@example.com' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="signin">
      <section aria-labelledby="intro">
        <h1 id="intro">Open a ticket. Follow it to resolution.</h1>
        <p class="lede">
          Customers see only their own requests. Agents work the whole queue, and every ticket moves through the same
          four statuses.
        </p>
        <div class="demo">
          <h2>Try a demo account</h2>
          <p class="muted small">Fills in the sign-in form. The password for all three is {{ demoPassword }}.</p>
          <div class="demo-row">
            @for (d of demos; track d.email) {
              <button type="button" class="quiet" (click)="fill(d.email)">{{ d.label }}</button>
            }
          </div>
        </div>
      </section>

      <form class="panel form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2>{{ mode() === 'login' ? 'Sign in' : 'Create an account' }}</h2>
        <label>
          Email
          <input type="email" autocomplete="email" formControlName="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
            formControlName="password"
          />
          @if (mode() === 'register') {
            <span class="field-hint">At least 8 characters.</span>
          }
        </label>
        <div aria-live="polite">
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
        </div>
        <button type="submit" [disabled]="loading()">
          {{ mode() === 'login' ? 'Sign in' : 'Create account' }}
        </button>
        <button type="button" class="link" (click)="toggle()">
          {{ mode() === 'login' ? 'No account yet? Create one' : 'Already registered? Sign in' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly demos = DEMOS;
  readonly demoPassword = DEMO_PASSWORD;
  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  fill(email: string) {
    this.form.setValue({ email, password: DEMO_PASSWORD });
    this.error.set('');
  }

  toggle() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set('');
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    const request = this.mode() === 'login' ? this.auth.login(email, password) : this.auth.register(email, password);
    request.subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
