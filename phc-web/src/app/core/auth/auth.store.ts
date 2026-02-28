import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, AuthMeResponse } from './auth.api';

@Injectable({ providedIn: 'root' })
export class AuthStore {
    private readonly _user = signal<User | null>(null);
    private readonly _loading = signal<boolean>(true);

    readonly user = this._user.asReadonly();
    readonly loading = this._loading.asReadonly();

    readonly isAuthenticated = computed(() => !!this._user());

    setLoading(value: boolean) {
        this._loading.set(value);
    }

    setUser(user: User) {
        this._user.set(user);
    }

    clear() {
        this._user.set(null);
    }
}
