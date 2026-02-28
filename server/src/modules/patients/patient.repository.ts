import { db } from '../../config/database';
import { Patient, CreatePatientDTO, UpdatePatientDTO } from './patient.types';

const TABLE = 'patients';

export async function findPatientById(id: string): Promise<Patient | null> {
    const patient = await db<Patient>(TABLE).where({ patient_id: id }).first();
    return patient ?? null;
}

export async function findAllPatients(): Promise<Patient[]> {
    return db<Patient>(TABLE).select('*');
}

export async function createPatient(patient_id: string, data: CreatePatientDTO): Promise<Patient> {
    await db<Patient>(TABLE).insert({
        ...data,
        patient_id,
    });
    return findPatientById(patient_id) as Promise<Patient>;
}

export async function updatePatient(id: string, data: UpdatePatientDTO): Promise<Patient | null> {
    await db<Patient>(TABLE).where({ patient_id: id }).update({ ...data, updated_at: new Date() });
    return findPatientById(id);
}

export async function deletePatient(id: string): Promise<void> {
    await db<Patient>(TABLE).where({ patient_id: id }).delete();
}
