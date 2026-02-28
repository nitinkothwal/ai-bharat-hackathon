import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientsApi } from '../patients.api';
import { Patient } from '../patients.model';
import { ReferralsApi } from '../../referrals/referrals.api';
import { Referral } from '../../referrals/referrals.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-patient-details-page',
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatDividerModule,
        MatChipsModule,
        MatTableModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './patient-details-page.html',
    styleUrl: './patient-details-page.scss',
})
export class PatientDetailsPage implements OnInit {
    private route = inject(ActivatedRoute);
    private patientsApi = inject(PatientsApi);
    private referralsApi = inject(ReferralsApi);

    patient = signal<Patient | null>(null);
    referrals = signal<Referral[]>([]);
    loading = signal(true);

    displayedColumns: string[] = ['referral_id', 'referral_type', 'status', 'risk_score', 'created_at'];

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadData(id);
        }
    }

    loadData(id: string) {
        this.loading.set(true);
        forkJoin({
            patient: this.patientsApi.getPatient(id),
            // Assuming the API supports filtering by patient_id
            referrals: this.referralsApi.getReferrals({ patient_id: id })
        }).subscribe({
            next: ({ patient, referrals }) => {
                this.patient.set(patient.patient);
                this.referrals.set(referrals.referrals);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }
}
