import { getDatabase } from './index';
import { Patient } from '../types';
import { Platform } from 'react-native';
import { encryptionService } from '../services/encryption';
import { auditLog } from '../services/auditLog';

export class PatientDatabaseService {
  private db = getDatabase;

  async createPatient(patient: Omit<Patient, 'id'> & { id?: string; aadhaar?: string }): Promise<Patient> {
    const db = this.db();
    const id = patient.id || `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const patientData: Patient = {
      ...patient,
      id,
      created_at: patient.created_at || new Date().toISOString(),
    };

    try {
      // Encrypt Aadhaar number if provided
      let encryptedAadhaar = null;
      if (patient.aadhaar) {
        try {
          encryptedAadhaar = encryptionService.encryptAadhaar(patient.aadhaar);
          await auditLog.logSecurityEvent('aadhaar_encrypted', 'info', {
            patientId: id,
            action: 'encrypt_aadhaar'
          });
        } catch (error) {
          await auditLog.logSecurityEvent('aadhaar_encryption_failed', 'error', {
            patientId: id,
            error: (error as Error).message
          });
          throw new Error('Failed to encrypt Aadhaar number');
        }
      }

      if (Platform.OS === 'web') {
        // Handle web platform with localStorage
        const patients = JSON.parse(localStorage.getItem('mock_patients') || '[]');
        const patientWithAadhaar = { ...patientData, aadhaar: encryptedAadhaar };
        patients.push(patientWithAadhaar);
        localStorage.setItem('mock_patients', JSON.stringify(patients));
        
        await auditLog.logDataEvent('patient_created', 'info', {
          patientId: id,
          platform: 'web'
        });
        
        return patientData;
      }

      await db.executeSql(
        `INSERT INTO patients (
          id, patient_id, full_name, age, gender, mobile_number, 
          village_code, village_name, address, aadhaar_number,
          created_by_asha_id, created_by_asha_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          patientData.id, // patient_id same as id for now
          patientData.name,
          patientData.age,
          patientData.gender,
          patientData.phone || null,
          'VIL001', // Default village code
          'Default Village',
          patientData.address || null,
          encryptedAadhaar, // Encrypted Aadhaar number
          patientData.asha_id,
          'ASHA Worker', // Default name
          now,
          now,
        ]
      );

      await auditLog.logDataEvent('patient_created', 'info', {
        patientId: id,
        platform: 'native',
        hasAadhaar: !!encryptedAadhaar
      });

      return patientData;
    } catch (error) {
      await auditLog.logDataEvent('patient_creation_failed', 'error', {
        patientId: id,
        error: (error as Error).message
      });
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async getAllPatients(): Promise<Patient[]> {
    const db = this.db();
    
    if (Platform.OS === 'web') {
      // Handle web platform with localStorage
      const patients = JSON.parse(localStorage.getItem('mock_patients') || '[]');
      return patients;
    }
    
    try {
      const [results] = await db.executeSql(
        'SELECT * FROM patients WHERE is_deleted = 0 ORDER BY created_at DESC'
      );

      const patients: Patient[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        patients.push({
          id: row.patient_id,
          name: row.full_name,
          age: row.age,
          gender: row.gender,
          phone: row.mobile_number,
          address: row.address,
          asha_id: row.created_by_asha_id,
          created_at: new Date(row.created_at).toISOString(),
        });
      }

      return patients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const db = this.db();
    
    if (Platform.OS === 'web') {
      // Handle web platform with localStorage
      const patients = JSON.parse(localStorage.getItem('mock_patients') || '[]');
      return patients.find((p: Patient) => p.id === id) || null;
    }
    
    try {
      const [results] = await db.executeSql(
        'SELECT * FROM patients WHERE patient_id = ? AND is_deleted = 0',
        [id]
      );

      if (results.rows.length === 0) {
        return null;
      }

      const row = results.rows.item(0);
      return {
        id: row.patient_id,
        name: row.full_name,
        age: row.age,
        gender: row.gender,
        phone: row.mobile_number,
        address: row.address,
        asha_id: row.created_by_asha_id,
        created_at: new Date(row.created_at).toISOString(),
      };
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      throw error;
    }
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
    const db = this.db();
    const now = Date.now();

    try {
      const setClause = [];
      const values = [];

      if (updates.name) {
        setClause.push('full_name = ?');
        values.push(updates.name);
      }
      if (updates.age) {
        setClause.push('age = ?');
        values.push(updates.age);
      }
      if (updates.gender) {
        setClause.push('gender = ?');
        values.push(updates.gender);
      }
      if (updates.phone) {
        setClause.push('mobile_number = ?');
        values.push(updates.phone);
      }
      if (updates.address) {
        setClause.push('address = ?');
        values.push(updates.address);
      }

      setClause.push('updated_at = ?');
      values.push(now);
      values.push(id);

      await db.executeSql(
        `UPDATE patients SET ${setClause.join(', ')} WHERE patient_id = ?`,
        values
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async deletePatient(id: string): Promise<void> {
    const db = this.db();
    const now = Date.now();

    try {
      await db.executeSql(
        'UPDATE patients SET is_deleted = 1, updated_at = ? WHERE patient_id = ?',
        [now, id]
      );
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const db = this.db();
    
    try {
      const [results] = await db.executeSql(
        `SELECT * FROM patients 
         WHERE is_deleted = 0 
         AND (full_name LIKE ? OR mobile_number LIKE ?) 
         ORDER BY created_at DESC`,
        [`%${query}%`, `%${query}%`]
      );

      const patients: Patient[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        patients.push({
          id: row.patient_id,
          name: row.full_name,
          age: row.age,
          gender: row.gender,
          phone: row.mobile_number,
          address: row.address,
          asha_id: row.created_by_asha_id,
          created_at: new Date(row.created_at).toISOString(),
        });
      }

      return patients;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async getUnsyncedPatients(): Promise<Patient[]> {
    const db = this.db();
    
    try {
      const [results] = await db.executeSql(
        'SELECT * FROM patients WHERE is_synced = 0 AND is_deleted = 0 ORDER BY created_at ASC'
      );

      const patients: Patient[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        patients.push({
          id: row.patient_id,
          name: row.full_name,
          age: row.age,
          gender: row.gender,
          phone: row.mobile_number,
          address: row.address,
          asha_id: row.created_by_asha_id,
          created_at: new Date(row.created_at).toISOString(),
        });
      }

      return patients;
    } catch (error) {
      console.error('Error fetching unsynced patients:', error);
      throw error;
    }
  }

  async markPatientAsSynced(id: string): Promise<void> {
    const db = this.db();
    
    try {
      await db.executeSql(
        'UPDATE patients SET is_synced = 1, updated_at = ? WHERE patient_id = ?',
        [Date.now(), id]
      );
    } catch (error) {
      console.error('Error marking patient as synced:', error);
      throw error;
    }
  }
}

export const patientDB = new PatientDatabaseService();