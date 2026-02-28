import { z } from 'zod';

export const createReferralBodySchema = z.object({
    patient_id: z.string().min(1),
    referral_type: z.enum(['pregnancy', 'malnutrition', 'tb_suspect', 'chronic_disease']),
    form_data: z.any(),
    asha_id: z.string().min(1),
    geolocation: z.any().optional(),
    audio_file_s3_keys: z.any().optional()
});

export const updateReferralStatusBodySchema = z.object({
    status: z.enum(['submitted', 'received_at_phc', 'under_evaluation', 'completed', 'follow_up_required', 'closed']),
    completion_data: z.any().optional()
});

export const getReferralParamsSchema = z.object({
    id: z.string().min(1),
});
