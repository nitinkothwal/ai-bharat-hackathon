import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { ApiResponse } from './api-response.model';

function handleApiSuccess(event: HttpEvent<any>): HttpEvent<any> {
    if (event instanceof HttpResponse) {
        // 204 No Content
        if (event.status === 204 || event.body == null) {
            return event.clone({ body: undefined });
        }

        const body = event.body as ApiResponse<unknown>;

        if (body?.success === true) {
            return event.clone({ body: body.data });
        }
    }

    return event;
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authStore = inject(AuthStore);

    return next(req).pipe(
        map((event: HttpEvent<any>) => handleApiSuccess(event)),
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
                authStore.clear();
                router.navigateByUrl('/welcome/login');
            }

            const apiError = err.error as ApiResponse;

            return throwError(() => ({
                status: err.status,
                message: apiError?.message || 'Unexpected error occurred',
                errors: apiError?.errors,
            }));
        })
    );
};
