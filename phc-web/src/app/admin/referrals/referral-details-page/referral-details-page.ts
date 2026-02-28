import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { ReferralsApi } from '../referrals.api';
import { Referral, ReferralStatus } from '../referrals.model';
import { PatientsApi } from '../../patients/patients.api';
import { Patient } from '../../patients/patients.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-referral-details-page',
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatChipsModule,
        MatListModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatFormFieldModule,
        FormsModule,
    ],
    templateUrl: './referral-details-page.html',
    styleUrl: './referral-details-page.scss',
})
export class ReferralDetailsPage implements OnInit {
    private route = inject(ActivatedRoute);
    private referralsApi = inject(ReferralsApi);
    private patientsApi = inject(PatientsApi);

    referral = signal<Referral | null>(null);
    patient = signal<Patient | null>(null);
    loading = signal(true);
    updatingStatus = signal(false);

    statuses: ReferralStatus[] = ['submitted', 'received_at_phc', 'under_evaluation', 'completed', 'follow_up_required', 'closed'];

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadData(id);
        }
    }

    loadData(id: string) {
        this.loading.set(true);
        this.referralsApi.getReferral(id).subscribe({
            next: (res) => {
                this.referral.set(res.referral);
                this.loadPatient(res.referral.patient_id);
            },
            error: () => this.loading.set(false),
        });
    }

    loadPatient(patientId: string) {
        this.patientsApi.getPatient(patientId).subscribe({
            next: (res) => {
                this.patient.set(res.patient);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    updateStatus(newStatus: ReferralStatus) {
        const id = this.referral()?.referral_id;
        if (!id) return;

        this.updatingStatus.set(true);
        this.referralsApi.updateReferralStatus(id, { status: newStatus }).subscribe({
            next: (res) => {
                this.referral.set(res.referral);
                this.updatingStatus.set(false);
            },
            error: () => this.updatingStatus.set(false),
        });
    }
}
