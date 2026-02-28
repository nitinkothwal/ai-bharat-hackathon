import { inject, Injectable } from '@angular/core';
import { Patient, CreatePatientInput, UpdatePatientInput } from './patients.model';
import { ApiClient } from '../../core/api/api.client';

@Injectable({ providedIn: 'root' })
export class PatientsApi {
    private api = inject(ApiClient);
    private baseUrl = '/patients';

    getPatients(params?: any) {
        return this.api.get<{ patients: Patient[] }>(this.baseUrl, { params });
    }

    getPatient(id: string) {
        return this.api.get<{ patient: Patient }>(`${this.baseUrl}/${id}`);
    }

    createPatient(input: CreatePatientInput) {
        return this.api.post<{ patient: Patient }>(this.baseUrl, input);
    }

    updatePatient(id: string, input: UpdatePatientInput) {
        return this.api.put<{ patient: Patient }>(`${this.baseUrl}/${id}`, input);
    }

    deletePatient(id: string) {
        return this.api.delete<void>(`${this.baseUrl}/${id}`);
    }
}
