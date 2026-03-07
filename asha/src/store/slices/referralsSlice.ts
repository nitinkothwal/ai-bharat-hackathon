import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Referral } from '../../types';
import { referralService } from '../../services/api';

interface ReferralsState {
  referrals: Referral[];
  isLoading: boolean;
  error: string | null;
  selectedReferral: Referral | null;
  filters: {
    status: string[];
    riskLevel: string[];
    referralType: string[];
    dateRange: {
      from: string | null;
      to: string | null;
    };
  };
}

const initialState: ReferralsState = {
  referrals: [],
  isLoading: false,
  error: null,
  selectedReferral: null,
  filters: {
    status: [],
    riskLevel: [],
    referralType: [],
    dateRange: {
      from: null,
      to: null,
    },
  },
};

// Async thunks
export const fetchReferrals = createAsyncThunk(
  'referrals/fetchReferrals',
  async (_, { rejectWithValue }) => {
    try {
      const referrals = await referralService.getQueue();
      return referrals;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createReferral = createAsyncThunk(
  'referrals/createReferral',
  async (referralData: Partial<Referral>, { rejectWithValue }) => {
    try {
      const referral = await referralService.create(referralData);
      return referral;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateReferralStatus = createAsyncThunk(
  'referrals/updateStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      // TODO: Implement status update API call
      const response = await fetch(`/api/referrals/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      return { id, status };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const referralsSlice = createSlice({
  name: 'referrals',
  initialState,
  reducers: {
    selectReferral: (state, action: PayloadAction<Referral | null>) => {
      state.selectedReferral = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ReferralsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch referrals
      .addCase(fetchReferrals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReferrals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.referrals = action.payload;
        state.error = null;
      })
      .addCase(fetchReferrals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create referral
      .addCase(createReferral.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReferral.fulfilled, (state, action) => {
        state.isLoading = false;
        state.referrals.push(action.payload);
        state.error = null;
      })
      .addCase(createReferral.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update referral status
      .addCase(updateReferralStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const referral = state.referrals.find(r => r.id === id);
        if (referral) {
          referral.status = status as any;
        }
      });
  },
});

export const { selectReferral, setFilters, clearFilters, clearError } = referralsSlice.actions;
export default referralsSlice.reducer;