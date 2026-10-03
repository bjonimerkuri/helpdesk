import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/errors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="card" [formGroup]="form" (ngSubmit)="submit()">
      <h2>{{ mode() === 'login' ? 'Log in' : 'Create account' }}</h2>
      <input type="email" placeholder="Email" formControlName="email" />
      <input type="password" placeholder="Password (min 8)" formControlName="password" />
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <button type="submit" [disabled]="form.invalid || loading()">
        {{ mode() === 'login' ? 'Log in' : 'Register' }}
      </button>
      <button type="button" class="link" (click)="toggle()">
        {{ mode() === 'login' ? 'Need an account?' : 'Have an account?' }}
      </button>
      <p class="hint">Demo: agent@example.com or customer@example.com, password123</p>
    </form>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  toggle() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set('');
  }

  submit() {
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    const request = this.mode() === 'login' ? this.auth.login(email, password) : this.auth.register(email, password);
    request.subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
