import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only employees and managers can open the employee page; anyone else goes to the login. */
export const employeeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isEmployee() ? true : inject(Router).createUrlTree(['/login']);
};
