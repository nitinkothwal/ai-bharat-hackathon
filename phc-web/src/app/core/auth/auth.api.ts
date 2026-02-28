import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api/api.client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthMeResponse {
    success: true;
    data: {
        user: User;
    };
}

export interface AuthMeErrorResponse {
    success: false;
    message: string;
}

export interface User {
    id: string | number;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
    private api = inject(ApiClient);

    login(data: LoginRequest) {
        return this.api.post<User>('/auth/login', data);
    }

    logout() {
        return this.api.post<void>('/auth/logout');
    }

    me() {
        return this.api.get<User>('/auth/me');
    }
}
