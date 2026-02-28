import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Patient, CreatePatientInput } from '../patients.model';

@Component({
    selector: 'app-patient-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
    ],
    templateUrl: './patient-form.html',
    styleUrl: './patient-form.scss',
})
export class PatientForm implements OnInit {
    private fb = inject(FormBuilder);

    patient = input<Patient | null>(null);
    save = output<CreatePatientInput>();
    cancel = output<void>();

    form = this.fb.group({
        full_name: ['', Validators.required],
        age: [0, [Validators.required, Validators.min(0), Validators.max(120)]],
        gender: ['male' as const, Validators.required],
        aadhaar_number: [''],
        mobile_number: [''],
        village_code: ['', Validators.required],
        address: ['', Validators.required],
        created_by_asha_id: ['ASH001', Validators.required],
    });

    ngOnInit() {
        const existingPatient = this.patient();
        if (existingPatient) {
            this.form.patchValue(existingPatient as any);
        }
    }

    onSubmit() {
        if (this.form.valid) {
            this.save.emit(this.form.value as CreatePatientInput);
        }
    }
}
