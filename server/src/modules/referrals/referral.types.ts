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
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
}

export type CreateReferralDTO = Omit<Referral, 'referral_id' | 'status' | 'created_at' | 'updated_at' | 'completed_at' | 'completion_data' | 'status_history' | 'ai_summary' | 'ai_summary_hindi' | 'risk_score' | 'risk_level' | 'risk_factors' | 'phc_code'>;

export interface UpdateReferralStatusDTO {
    status: ReferralStatus;
    completion_data?: any;
}
