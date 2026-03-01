export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    phone?: string;
    address?: string;
    asha_id: string;
    created_at: string;
}

export type ReferralStatus = 'submitted' | 'received_at_phc' | 'under_evaluation' | 'completed' | 'follow_up_required' | 'closed';

export interface Referral {
    id: string;
    patient_id: string;
    patient_name?: string;
    referral_type: 'pregnancy' | 'malnutrition' | 'tb_suspect' | 'chronic_disease';
    form_data: any;
    status: ReferralStatus;
    risk_score?: number;
    risk_level?: 'low' | 'medium' | 'high';
    risk_factors?: any;
    asha_id: string;
    geolocation?: any;
    created_at: string;
}


export interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
}
