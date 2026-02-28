import { Routes } from '@angular/router';
import { AdminLayout } from './admin-layout/admin-layout';
import { authGuard } from '../core/auth/auth.guard';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'tools',
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'patients',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./patients/patients-page/patients-page').then(m => m.PatientsPage),
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./patients/patient-editor-page/patient-editor-page').then(m => m.PatientEditorPage),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./patients/patient-editor-page/patient-editor-page').then(m => m.PatientEditorPage),
                    },
                    {
                        path: ':id/details',
                        loadComponent: () =>
                            import('./patients/patient-details-page/patient-details-page').then(m => m.PatientDetailsPage),
                    }
                ]
            },
            {
                path: 'referrals',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./referrals/referrals-page/referrals-page').then(m => m.ReferralsPage),
                    },
                    {
                        path: ':id/details',
                        loadComponent: () =>
                            import('./referrals/referral-details-page/referral-details-page').then(m => m.ReferralDetailsPage),
                    }
                ]
            },
        ],
    },
];
