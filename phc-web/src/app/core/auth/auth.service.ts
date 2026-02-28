import { Injectable, inject } from '@angular/core';
import { AuthApi, LoginRequest } from './auth.api';
import { AuthStore } from './auth.store';
import { catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(AuthApi);
    private store = inject(AuthStore);

    login(data: LoginRequest) {
        this.store.setLoading(true);

        return this.api.login(data).pipe(
            tap({
                next: user => {
                    this.store.setUser(user);
                    this.store.setLoading(false);
                },
                error: () => this.store.setLoading(false)
            })
        );
    }

    logout() {
        return this.api.logout().pipe(
            tap(() => this.store.clear())
        );
    }

    restoreSession() {
        this.store.setLoading(true);
        return this.api.me().pipe(
            tap({
                next: user => this.store.setUser(user),
                complete: () => this.store.setLoading(false),
                error: () => this.store.setLoading(false)
            }),
            catchError(() => of(null))
        );
    }
}
