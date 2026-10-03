import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { User } from './models';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly current = signal<User | null>(this.read());

  readonly user = this.current.asReadonly();
  readonly isLoggedIn = computed(() => this.current() !== null);
  readonly isStaff = computed(() => {
    const role = this.current()?.role;
    return role === 'agent' || role === 'admin';
  });

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap((r) => this.store(r)));
  }

  register(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, { email, password })
      .pipe(tap((r) => this.store(r)));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.current.set(null);
    this.router.navigateByUrl('/login');
  }

  private store(response: AuthResponse) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.current.set(response.user);
  }

  private read(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
