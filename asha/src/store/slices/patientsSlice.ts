import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Patient } from '../../types';
import { patientService } from '../../services/api';

interface PatientsState {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedPatient: Patient | null;
}

const initialState: PatientsState = {
  patients: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedPatient: null,
};

// Async thunks
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async (_, { rejectWithValue }) => {
    try {
      const patients = await patientService.getAll();
      return patients;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPatient = createAsyncThunk(
  'patients/createPatient',
  async (patientData: Partial<Patient>, { rejectWithValue }) => {
    try {
      const patient = await patientService.create(patientData);
      return patient;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    selectPatient: (state, action: PayloadAction<Patient | null>) => {
      state.selectedPatient = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch patients
      .addCase(fetchPatients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = action.payload;
        state.error = null;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create patient
      .addCase(createPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients.push(action.payload);
        state.error = null;
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, selectPatient, clearError } = patientsSlice.actions;
export default patientsSlice.reducer;