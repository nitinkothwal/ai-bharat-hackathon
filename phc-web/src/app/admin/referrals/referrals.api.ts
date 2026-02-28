import { inject, Injectable } from '@angular/core';
import { Referral, CreateReferralInput, UpdateReferralStatusInput } from './referrals.model';
import { ApiClient } from '../../core/api/api.client';

@Injectable({ providedIn: 'root' })
export class ReferralsApi {
    private api = inject(ApiClient);
    private baseUrl = '/referrals';

    getReferrals(params?: any) {
        return this.api.get<{ referrals: Referral[] }>(this.baseUrl, { params });
    }

    getReferral(id: string) {
        return this.api.get<{ referral: Referral }>(`${this.baseUrl}/${id}`);
    }

    createReferral(input: CreateReferralInput) {
        return this.api.post<{ referral: Referral }>(this.baseUrl, input);
    }

    updateReferralStatus(id: string, input: UpdateReferralStatusInput) {
        return this.api.put<{ referral: Referral }>(`${this.baseUrl}/${id}/status`, input);
    }

    deleteReferral(id: string) {
        return this.api.delete<void>(`${this.baseUrl}/${id}`);
    }
}
