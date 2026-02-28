import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
    return inject(AuthStore).isAuthenticated();
};
