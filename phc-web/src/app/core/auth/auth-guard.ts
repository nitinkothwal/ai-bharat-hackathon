import { CanActivateFn } from '@angular/router';
import { AuthStore } from './auth.store';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  return store.isAuthenticated()
    ? true
    : router.createUrlTree(['/welcome/login']);
};
