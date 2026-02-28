import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'admin',
        loadChildren: () =>
            import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    },
    {
        path: 'welcome',
        loadChildren: () =>
            import('./public/public.routes').then(m => m.PUBLIC_ROUTES),
    },
    {
        path: '403',
        loadComponent: () =>
            import('./public/errors/unauthorized/unauthorized').then(m => m.Unauthorized),
    },
    {
        path: '404',
        loadComponent: () =>
            import('./public/errors/not-found/not-found').then(m => m.NotFound),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'welcome',
    },
    {
        path: '**',
        redirectTo: '404',
    },
];
