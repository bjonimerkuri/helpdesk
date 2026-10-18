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

const TOKEN_KEY = 'helpdesk.token';
const USER_KEY = 'helpdesk.user';

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

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }).pipe(tap((r) => this.store(r)));
  }

  register(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, { email, password }).pipe(tap((r) => this.store(r)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.current.set(null);
    void this.router.navigateByUrl('/login');
  }

  private store(response: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.current.set(response.user);
  }

  private read(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw && localStorage.getItem(TOKEN_KEY) ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
