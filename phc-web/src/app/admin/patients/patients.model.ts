export interface Patient {
    patient_id: string;
    aadhaar_number: string | null;
    full_name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    mobile_number: string | null;
    village_code: string;
    address: string;
    created_by_asha_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePatientInput {
    aadhaar_number?: string | null;
    full_name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    mobile_number?: string | null;
    village_code: string;
    address: string;
    created_by_asha_id: string;
}

export interface UpdatePatientInput extends Partial<Omit<CreatePatientInput, 'created_by_asha_id'>> { }
