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
    created_at: Date;
    updated_at: Date;
}

export type CreatePatientDTO = Omit<Patient, 'patient_id' | 'created_at' | 'updated_at'>;

export type UpdatePatientDTO = Partial<Omit<Patient, 'patient_id' | 'created_at' | 'updated_at' | 'created_by_asha_id'>>;
