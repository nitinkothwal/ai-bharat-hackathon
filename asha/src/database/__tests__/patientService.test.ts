import { Platform } from 'react-native';
import { PatientDatabaseService } from '../patientService';
import { Patient } from '../../types';

// Mock the database
const mockExecuteSql = jest.fn();
const mockGetDatabase = jest.fn(() => ({
  executeSql: mockExecuteSql,
}));

jest.mock('../index', () => ({
  getDatabase: mockGetDatabase,
}));

// Mock localStorage for web platform
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('PatientDatabaseService', () => {
  let patientService: PatientDatabaseService;
  
  const mockPatient: Omit<Patient, 'id'> = {
    name: 'Test Patient',
    age: 30,
    gender: 'female',
    phone: '9876543210',
    address: 'Test Address',
    asha_id: 'ASHA001',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    patientService = new PatientDatabaseService();
  });

  describe('Native Platform', () => {
    beforeEach(() => {
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    });

    describe('createPatient', () => {
      it('should create a patient successfully', async () => {
        mockExecuteSql.mockResolvedValue([{ rows: { length: 1 } }]);
        
        const result = await patientService.createPatient(mockPatient);
        
        expect(result).toMatchObject(mockPatient);
        expect(result.id).toBeDefined();
        expect(mockExecuteSql).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO patients'),
          expect.arrayContaining([
            expect.any(String), // id
            expect.any(String), // patient_id
            mockPatient.name,
            mockPatient.age,
            mockPatient.gender,
            mockPatient.phone,
            'VIL001', // village_code
            'Default Village',
            mockPatient.address,
            null, // aadhaar_number
            mockPatient.asha_id,
            'ASHA Worker',
            expect.any(Number), // created_at
            expect.any(Number), // updated_at
          ])
        );
      });

      it('should handle database errors during patient creation', async () => {
        mockExecuteSql.mockRejectedValue(new Error('Database error'));
        
        await expect(patientService.createPatient(mockPatient)).rejects.toThrow('Database error');
      });
    });

    describe('getAllPatients', () => {
      it('should fetch all patients successfully', async () => {
        const mockRows = {
          length: 2,
          item: jest.fn()
            .mockReturnValueOnce({
              patient_id: 'patient1',
              full_name: 'Patient 1',
              age: 25,
              gender: 'male',
              mobile_number: '9876543210',
              address: 'Address 1',
              created_by_asha_id: 'ASHA001',
              created_at: Date.now(),
            })
            .mockReturnValueOnce({
              patient_id: 'patient2',
              full_name: 'Patient 2',
              age: 35,
              gender: 'female',
              mobile_number: '9876543211',
              address: 'Address 2',
              created_by_asha_id: 'ASHA002',
              created_at: Date.now(),
            }),
        };
        
        mockExecuteSql.mockResolvedValue([{ rows: mockRows }]);
        
        const result = await patientService.getAllPatients();
        
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          id: 'patient1',
          name: 'Patient 1',
          age: 25,
          gender: 'male',
        });
        expect(mockExecuteSql).toHaveBeenCalledWith(
          'SELECT * FROM patients WHERE is_deleted = 0 ORDER BY created_at DESC'
        );
      });

      it('should return empty array when no patients found', async () => {
        mockExecuteSql.mockResolvedValue([{ rows: { length: 0 } }]);
        
        const result = await patientService.getAllPatients();
        
        expect(result).toEqual([]);
      });
    });

    describe('getPatientById', () => {
      it('should fetch patient by ID successfully', async () => {
        const mockRow = {
          patient_id: 'patient1',
          full_name: 'Test Patient',
          age: 30,
          gender: 'female',
          mobile_number: '9876543210',
          address: 'Test Address',
          created_by_asha_id: 'ASHA001',
          created_at: Date.now(),
        };
        
        mockExecuteSql.mockResolvedValue([{ 
          rows: { 
            length: 1, 
            item: () => mockRow 
          } 
        }]);
        
        const result = await patientService.getPatientById('patient1');
        
        expect(result).toMatchObject({
          id: 'patient1',
          name: 'Test Patient',
          age: 30,
          gender: 'female',
        });
        expect(mockExecuteSql).toHaveBeenCalledWith(
          'SELECT * FROM patients WHERE patient_id = ? AND is_deleted = 0',
          ['patient1']
        );
      });

      it('should return null when patient not found', async () => {
        mockExecuteSql.mockResolvedValue([{ rows: { length: 0 } }]);
        
        const result = await patientService.getPatientById('nonexistent');
        
        expect(result).toBeNull();
      });
    });

    describe('updatePatient', () => {
      it('should update patient successfully', async () => {
        mockExecuteSql.mockResolvedValue([{ rows: { length: 1 } }]);
        
        const updates = { name: 'Updated Name', age: 31 };
        
        await patientService.updatePatient('patient1', updates);
        
        expect(mockExecuteSql).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE patients SET'),
          expect.arrayContaining(['Updated Name', 31, expect.any(Number), 'patient1'])
        );
      });
    });

    describe('deletePatient', () => {
      it('should soft delete patient successfully', async () => {
        mockExecuteSql.mockResolvedValue([{ rows: { length: 1 } }]);
        
        await patientService.deletePatient('patient1');
        
        expect(mockExecuteSql).toHaveBeenCalledWith(
          'UPDATE patients SET is_deleted = 1, updated_at = ? WHERE patient_id = ?',
          [expect.any(Number), 'patient1']
        );
      });
    });

    describe('searchPatients', () => {
      it('should search patients by name and phone', async () => {
        const mockRows = {
          length: 1,
          item: () => ({
            patient_id: 'patient1',
            full_name: 'John Doe',
            age: 25,
            gender: 'male',
            mobile_number: '9876543210',
            address: 'Address 1',
            created_by_asha_id: 'ASHA001',
            created_at: Date.now(),
          }),
        };
        
        mockExecuteSql.mockResolvedValue([{ rows: mockRows }]);
        
        const result = await patientService.searchPatients('John');
        
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('John Doe');
        expect(mockExecuteSql).toHaveBeenCalledWith(
          expect.stringContaining('WHERE is_deleted = 0 AND (full_name LIKE ? OR mobile_number LIKE ?)'),
          ['%John%', '%John%']
        );
      });
    });

    describe('getUnsyncedPatients', () => {
      it('should fetch unsynced patients', async () => {
        const mockRows = {
          length: 1,
          item: () => ({
            patient_id: 'patient1',
            full_name: 'Unsynced Patient',
            age: 25,
            gender: 'male',
            mobile_number: '9876543210',
            address: 'Address 1',
            created_by_asha_id: 'ASHA001',
            created_at: Date.now(),
          }),
        };
        
        mockExecuteSql.mockResolvedValue([{ rows: mockRows }]);
        
        const result = await patientService.getUnsyncedPatients();
        
        expect(result).toHaveLength(1);
        expect(mockExecuteSql).toHaveBeenCalledWith(
          'SELECT * FROM patients WHERE is_synced = 0 AND is_deleted = 0 ORDER BY created_at ASC'
        );
      });
    });

    describe('markPatientAsSynced', () => {
      it('should mark patient as synced', async () => {
        mockExecuteSql.mockResolvedValue([{ rows: { length: 1 } }]);
        
        await patientService.markPatientAsSynced('patient1');
        
        expect(mockExecuteSql).toHaveBeenCalledWith(
          'UPDATE patients SET is_synced = 1, updated_at = ? WHERE patient_id = ?',
          [expect.any(Number), 'patient1']
        );
      });
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    });

    describe('createPatient', () => {
      it('should create patient in localStorage on web platform', async () => {
        mockLocalStorage.getItem.mockReturnValue('[]');
        
        const result = await patientService.createPatient(mockPatient);
        
        expect(result).toMatchObject(mockPatient);
        expect(result.id).toBeDefined();
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mock_patients');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'mock_patients',
          expect.stringContaining(mockPatient.name)
        );
      });
    });

    describe('getAllPatients', () => {
      it('should fetch patients from localStorage on web platform', async () => {
        const mockPatientsData = [
          { id: 'patient1', name: 'Patient 1', age: 25, gender: 'male' },
          { id: 'patient2', name: 'Patient 2', age: 35, gender: 'female' },
        ];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPatientsData));
        
        const result = await patientService.getAllPatients();
        
        expect(result).toEqual(mockPatientsData);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mock_patients');
      });
    });

    describe('getPatientById', () => {
      it('should find patient by ID in localStorage', async () => {
        const mockPatientsData = [
          { id: 'patient1', name: 'Patient 1', age: 25, gender: 'male' },
          { id: 'patient2', name: 'Patient 2', age: 35, gender: 'female' },
        ];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPatientsData));
        
        const result = await patientService.getPatientById('patient1');
        
        expect(result).toEqual(mockPatientsData[0]);
      });

      it('should return null when patient not found in localStorage', async () => {
        mockLocalStorage.getItem.mockReturnValue('[]');
        
        const result = await patientService.getPatientById('nonexistent');
        
        expect(result).toBeNull();
      });
    });
  });
});