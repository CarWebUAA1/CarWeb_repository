import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { LoggedUser, LoginRequest, LoginResponse } from '../models/user.model';
import { UserService } from './user.service';

/** Roles that can use the employee page (see Documentation/Tecnical_Data/Security.md). */
export const EMPLOYEE_ROLES = ['employee', 'manager'];

const STORAGE_KEY = 'carweb.user';

/**
 * Keeps the logged-in user for the current browser tab.
 *
 * Note: this is client-side state only. The backend does not issue a session or token yet,
 * so it does not protect any API endpoint; it only decides which pages the UI shows.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly currentUser = signal<LoggedUser | null>(this.restore());

  readonly user = this.currentUser.asReadonly();
  readonly isEmployee = computed(() => isEmployeeRole(this.currentUser()?.role));

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.userService.login(credentials).pipe(
      tap((response) => {
        if (response.user) this.setUser(response.user);
      }),
    );
  }

  logout() {
    this.setUser(null);
  }

  private setUser(user: LoggedUser | null) {
    this.currentUser.set(user);
    if (!this.isBrowser) return;
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORAGE_KEY);
  }

  private restore(): LoggedUser | null {
    if (!this.isBrowser) return null;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as LoggedUser) : null;
    } catch {
      return null;
    }
  }
}

export function isEmployeeRole(role: string | undefined): boolean {
  return !!role && EMPLOYEE_ROLES.includes(role.toLowerCase());
}
