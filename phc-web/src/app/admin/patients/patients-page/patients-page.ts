import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PatientsApi } from '../patients.api';
import { Patient } from '../patients.model';

@Component({
    selector: 'app-patients-page',
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    templateUrl: './patients-page.html',
    styleUrl: './patients-page.scss',
})
export class PatientsPage {
    private patientsApi = inject(PatientsApi);

    patients = signal<Patient[]>([]);
    displayedColumns: string[] = ['patient_id', 'full_name', 'age', 'gender', 'village_code', 'actions'];

    constructor() {
        this.loadPatients();
    }

    loadPatients() {
        this.patientsApi.getPatients().subscribe((res) => {
            this.patients.set(res.patients);
        });
    }

    deletePatient(id: string) {
        if (confirm('Are you sure you want to delete this patient?')) {
            this.patientsApi.deletePatient(id).subscribe(() => {
                this.loadPatients();
            });
        }
    }
}
