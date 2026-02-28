import * as PatientRepo from './patient.repository';
import { CreatePatientDTO, UpdatePatientDTO } from './patient.types';
import { v4 as uuidv4 } from 'uuid';

export const PatientService = {
    async getAll() {
        return PatientRepo.findAllPatients();
    },

    async getById(id: string) {
        return PatientRepo.findPatientById(id);
    },

    async create(data: CreatePatientDTO) {
        const ashaCode = data.created_by_asha_id.substring(0, 6).toUpperCase() || 'ASH001';
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSeq = Math.floor(100 + Math.random() * 900); // 3 digits
        const patientId = `${ashaCode}-${dateStr}-${randomSeq}`;

        return PatientRepo.createPatient(patientId, data);
    },

    async update(id: string, data: UpdatePatientDTO) {
        const updated = await PatientRepo.updatePatient(id, data);
        if (!updated) {
            throw new Error('Patient not found');
        }
        return updated;
    },

    async delete(id: string) {
        const patient = await PatientRepo.findPatientById(id);
        if (!patient) {
            throw new Error('Patient not found');
        }
        await PatientRepo.deletePatient(id);
    },
};
