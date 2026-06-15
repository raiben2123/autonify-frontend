import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable, Subscription, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

const ACCESS_TOKEN_KEY  = 'autonify_access_token';
const REFRESH_TOKEN_KEY = 'autonify_refresh_token';
const USER_KEY          = 'autonify_user';

/** Margen antes de expiración para refrescar proactivamente (ms) */
const REFRESH_MARGIN_MS = 2 * 60 * 1000; // 2 minutos

/**
 * AuthService usa HttpClient directamente (no ApiService) porque
 * los endpoints /auth/* no llevan Bearer token y son un caso especial.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http      = inject(HttpClient);
  private readonly router    = inject(Router);
  private readonly authBase  = `${environment.apiUrl}/auth`;

  private _user  = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));

  readonly user       = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly userId     = computed(() => this._user()?.id ?? '');
  readonly userRole   = computed(() => this._user()?.role ?? '');
  readonly isOwner    = computed(() => this._user()?.role === 'OWNER');
  readonly isAdmin    = computed(() => this._user()?.role === 'ADMIN' || this._user()?.role === 'OWNER');
  readonly fullName   = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });
  private refreshTimer: Subscription | null = null;

  constructor() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      this.scheduleProactiveRefresh(token);
    }
  }
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authBase}/login`, credentials)
      .pipe(tap(res => this.saveSession(res)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authBase}/register`, data)
      .pipe(tap(res => this.saveSession(res)));
  }

  logout(): void {
    this.cancelRefreshTimer();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return this.http
      .post<AuthResponse>(`${this.authBase}/refresh`, { refreshToken })
      .pipe(tap(res => this.saveSession(res)));
  }

  getAccessToken(): string | null {
    return this._token();
  }
  private saveSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY,  res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set(res.user);
    this.scheduleProactiveRefresh(res.accessToken);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  /**
   * Decodifica el JWT (sin verificar firma, solo payload) para obtener `exp`,
   * y programa un timer que refresca el token REFRESH_MARGIN_MS antes de que expire.
   */
  private scheduleProactiveRefresh(accessToken: string): void {
    this.cancelRefreshTimer();

    const exp = this.getTokenExpiry(accessToken);
    if (!exp) return;

    const now       = Date.now();
    const expiresIn = exp * 1000 - now;           // ms hasta expiración
    const delay     = expiresIn - REFRESH_MARGIN_MS; // disparar 2 min antes

    if (delay <= 0) {
      this.doProactiveRefresh();
      return;
    }

    this.refreshTimer = timer(delay).subscribe(() => this.doProactiveRefresh());
  }

  private doProactiveRefresh(): void {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return;

    this.refreshToken().subscribe({
      next: () => {
      },
      error: () => {
        this.logout();
      },
    });
  }

  private cancelRefreshTimer(): void {
    this.refreshTimer?.unsubscribe();
    this.refreshTimer = null;
  }

  /**
   * Extrae el campo `exp` del payload del JWT sin librería externa.
   * Retorna null si el token es inválido.
   */
  private getTokenExpiry(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded.exp ?? null;
    } catch {
      return null;
    }
  }
}
