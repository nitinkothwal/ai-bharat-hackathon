import { z } from 'zod';

export const createPatientBodySchema = z.object({
    aadhaar_number: z.string().nullable().optional(),
    full_name: z.string().min(1, 'Full name is required'),
    age: z.number().int().min(0).max(120),
    gender: z.enum(['male', 'female', 'other']),
    mobile_number: z.string().nullable().optional(),
    village_code: z.string().min(1),
    address: z.string().min(1),
    created_by_asha_id: z.string().min(1),
});

export const updatePatientBodySchema = createPatientBodySchema.partial().omit({ created_by_asha_id: true });

export const getPatientParamsSchema = z.object({
    id: z.string().min(1),
});
