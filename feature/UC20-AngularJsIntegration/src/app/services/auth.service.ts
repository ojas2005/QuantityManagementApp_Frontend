import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  success: boolean;
  user?: { username: string; email: string };
  token?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'qm_user';

  /** Signal holding the currently logged-in user (null = anonymous) */
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {
    // Rehydrate from localStorage on init
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { this.currentUser.set(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }

  setUser(user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  login(emailOrUsername: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiBase}/api/Auth/login`,
      { emailOrUsername, password }
    );
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiBase}/api/Auth/register`,
      { username, email, password }
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getAuthHeaders(): Record<string, string> {
    const user = this.currentUser();
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  }

  redirectGoogleLogin(): void {
    window.location.href = `${environment.apiBase}/api/Auth/google`;
  }

  /** Called on app init to handle OAuth redirect callback */
  handleOAuthCallback(): void {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const userParam = url.searchParams.get('user');
    if (token && userParam) {
      try {
        const u = JSON.parse(decodeURIComponent(userParam));
        this.setUser({
          username: u.username || u.email,
          email: u.email,
          token: decodeURIComponent(token)
        });
        window.history.replaceState({}, document.title, '/');
      } catch { /* ignore malformed params */ }
    }
  }
}
