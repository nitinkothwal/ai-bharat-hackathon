export type ReferralStatus = 'submitted' | 'received_at_phc' | 'under_evaluation' | 'completed' | 'follow_up_required' | 'closed';

export interface Referral {
    referral_id: string;
    patient_id: string;
    referral_type: 'pregnancy' | 'malnutrition' | 'tb_suspect' | 'chronic_disease';
    form_data: any;
    status: ReferralStatus;
    risk_score: number | null;
    risk_level: 'low' | 'medium' | 'high' | null;
    risk_factors: any | null;
    asha_id: string;
    geolocation: any | null;
    audio_file_s3_keys: any | null;
    ai_summary: string | null;
    ai_summary_hindi: string | null;
    phc_code: string | null;
    completion_data: any | null;
    status_history: any | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface CreateReferralInput {
    patient_id: string;
    referral_type: 'pregnancy' | 'malnutrition' | 'tb_suspect' | 'chronic_disease';
    form_data: any;
    asha_id: string;
    geolocation?: any | null;
    audio_file_s3_keys?: any | null;
}

export interface UpdateReferralStatusInput {
    status: ReferralStatus;
    completion_data?: any;
}
