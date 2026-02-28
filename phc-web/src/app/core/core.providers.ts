import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiInterceptor } from './api/api.interceptor';
import { inject, provideAppInitializer } from '@angular/core';
import { AuthService } from './auth/auth.service';

export function provideCore() {
    return [
        provideAppInitializer(() => {
            const authService = inject(AuthService);
            return authService.restoreSession();
        }),
        provideHttpClient(
            withInterceptors([apiInterceptor])
        )
    ];
}
