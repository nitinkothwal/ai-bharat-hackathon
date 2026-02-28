import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientsApi } from '../patients.api';
import { Patient, CreatePatientInput } from '../patients.model';
import { PatientForm } from '../patient-form/patient-form';

@Component({
    selector: 'app-patient-editor-page',
    imports: [CommonModule, MatProgressSpinnerModule, PatientForm],
    template: `
    <div class="page-container">
      @if (loading()) {
        <div class="loader">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="page-header">
          <h1>{{ isEditMode() ? 'Edit' : 'Add New' }} Patient</h1>
        </div>
        <div class="form-card mat-elevation-z1">
          <app-patient-form
            [patient]="patient()"
            (save)="onSave($event)"
            (cancel)="onCancel()"
          ></app-patient-form>
        </div>
      }
    </div>
  `,
    styles: [`
    .page-container {
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;

        .loader {
            display: flex;
            justify-content: center;
            padding: 48px;
        }

        .page-header {
            margin-bottom: 24px;
            h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 500;
            }
        }

        .form-card {
            background: white;
            padding: 24px;
            border-radius: 8px;
        }
    }
  `]
})
export class PatientEditorPage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(PatientsApi);

    patient = signal<Patient | null>(null);
    loading = signal(false);
    isEditMode = signal(false);

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'new') {
            this.isEditMode.set(true);
            this.loadPatient(id);
        }
    }

    loadPatient(id: string) {
        this.loading.set(true);
        this.api.getPatient(id).subscribe({
            next: (res) => {
                this.patient.set(res.patient);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    onSave(input: CreatePatientInput) {
        const id = this.patient()?.patient_id;
        const obs = id ? this.api.updatePatient(id, input) : this.api.createPatient(input);

        obs.subscribe(() => {
            this.router.navigate(['/admin/patients']);
        });
    }

    onCancel() {
        this.router.navigate(['/admin/patients']);
    }
}
