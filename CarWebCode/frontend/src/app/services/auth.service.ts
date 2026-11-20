import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

import {
  LoggedUser,
  LoginRequest,
  LoginResponse
} from '../models/user.model';

import { UserService } from './user.service';

export const EMPLOYEE_ROLES = ['employee', 'manager'];

const STORAGE_KEY = 'carweb.user';
const TOKEN_KEY = 'carweb.token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly userService = inject(UserService);

  private readonly isBrowser =
    isPlatformBrowser(inject(PLATFORM_ID));

  private readonly currentUser =
    signal<LoggedUser | null>(this.restoreUser());

  private readonly currentToken =
    signal<string | null>(this.restoreToken());

  readonly user = this.currentUser.asReadonly();
  readonly token = this.currentToken.asReadonly();

  readonly isEmployee = computed(
    () => isEmployeeRole(this.currentUser()?.role)
  );

  readonly isManager = computed(
    () => isManagerRole(this.currentUser()?.role)
  );

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.userService.login(credentials).pipe(
      tap((response) => {
        if (response.user && response.token) {
          this.setSession(response.user, response.token);
        }
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.currentToken.set(null);

    if (!this.isBrowser) return;

    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  private setSession(user: LoggedUser, token: string): void {
    this.currentUser.set(user);
    this.currentToken.set(token);

    if (!this.isBrowser) return;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  private restoreUser(): LoggedUser | null {
    if (!this.isBrowser) return null;

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) as LoggedUser : null;
    } catch {
      return null;
    }
  }

  private restoreToken(): string | null {
    if (!this.isBrowser) return null;

    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}

export function isEmployeeRole(role: string | undefined): boolean {
  return !!role && EMPLOYEE_ROLES.includes(role.toLowerCase());
}

export function isManagerRole(role: string | undefined): boolean {
  return role?.toLowerCase() === 'manager';
}
