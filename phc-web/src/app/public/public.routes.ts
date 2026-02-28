import { Routes } from '@angular/router';
import { PublicLayout } from './public-layout/public-layout';
import { loginRedirectGuard } from '../core/auth/login-redirect-guard';

export const PUBLIC_ROUTES: Routes = [
    {
        path: '',
        component: PublicLayout,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'login',
            },
            {
                path: 'login',
                canActivate: [loginRedirectGuard],
                loadComponent: () =>
                    import('./login/login').then(m => m.Login),
            },
        ],
    },
];
