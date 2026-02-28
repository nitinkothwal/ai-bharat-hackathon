import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ReferralsApi } from '../referrals.api';
import { Referral } from '../referrals.model';

@Component({
    selector: 'app-referrals-page',
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
    ],
    templateUrl: './referrals-page.html',
    styleUrl: './referrals-page.scss',
})
export class ReferralsPage {
    private referralsApi = inject(ReferralsApi);

    referrals = signal<Referral[]>([]);
    displayedColumns: string[] = ['risk', 'referral_id', 'patient_id', 'type', 'status', 'created_at', 'actions'];

    constructor() {
        this.loadReferrals();
    }

    loadReferrals() {
        // We might want to sort by risk_score descending in the future
        this.referralsApi.getReferrals().subscribe((res) => {
            this.referrals.set(res.referrals.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)));
        });
    }
}
