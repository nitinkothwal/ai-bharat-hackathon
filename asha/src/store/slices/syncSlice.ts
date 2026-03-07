import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offlineService } from '../../services/offline';
import { NetworkUtils } from '../../utils/network';

interface SyncItem {
  id: string;
  type: 'patient' | 'referral' | 'audio';
  data: any;
  priority: number; // Higher number = higher priority
  retryCount: number;
  lastAttempt: number | null;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  syncQueue: SyncItem[];
  pendingItems: SyncItem[];
  lastSyncTime: string | null;
  syncProgress: number;
  error: string | null;
}

const initialState: SyncState = {
  isOnline: false,
  isSyncing: false,
  syncQueue: [],
  pendingItems: [],
  lastSyncTime: null,
  syncProgress: 0,
  error: null,
};

// Async thunks
export const checkNetworkStatus = createAsyncThunk(
  'sync/checkNetworkStatus',
  async () => {
    const netInfo = await NetworkUtils.getNetworkInfo();
    return netInfo.isConnected && netInfo.isInternetReachable;
  }
);

export const checkSyncStatus = createAsyncThunk(
  'sync/checkSyncStatus',
  async () => {
    const netInfo = await NetworkUtils.getNetworkInfo();
    return {
      isOnline: netInfo.isConnected && netInfo.isInternetReachable,
      lastSyncTime: Date.now(), // TODO: Get from storage
    };
  }
);

export const syncData = createAsyncThunk(
  'sync/syncData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Sync offline referrals
      const syncedCount = await offlineService.syncOfflineReferrals();
      return { syncedCount };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const addToSyncQueue = createAsyncThunk(
  'sync/addToQueue',
  async ({ type, data, priority = 1 }: { type: 'patient' | 'referral' | 'audio'; data: any; priority?: number }) => {
    const item: SyncItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority,
      retryCount: 0,
      lastAttempt: null,
      status: 'pending',
    };
    return item;
  }
);

export const syncPendingItems = createAsyncThunk(
  'sync/syncPendingItems',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { sync: SyncState };
      const pendingItems = state.sync.syncQueue
        .filter(item => item.status === 'pending' || item.status === 'failed')
        .sort((a, b) => b.priority - a.priority); // Higher priority first

      const results = [];
      
      for (const item of pendingItems) {
        try {
          dispatch(updateSyncItemStatus({ id: item.id, status: 'syncing' }));
          
          // Implement actual sync logic based on item type
          switch (item.type) {
            case 'referral':
              await offlineService.syncOfflineReferrals();
              break;
            case 'patient':
              // TODO: Implement patient sync
              break;
            case 'audio':
              // TODO: Implement audio file sync
              break;
          }
          
          dispatch(updateSyncItemStatus({ id: item.id, status: 'synced' }));
          results.push({ id: item.id, success: true });
        } catch (error) {
          dispatch(updateSyncItemStatus({ 
            id: item.id, 
            status: 'failed',
            retryCount: item.retryCount + 1 
          }));
          results.push({ id: item.id, success: false, error: (error as Error).message });
        }
      }
      
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    updateSyncItemStatus: (state, action: PayloadAction<{ 
      id: string; 
      status: SyncItem['status']; 
      retryCount?: number 
    }>) => {
      const { id, status, retryCount } = action.payload;
      const item = state.syncQueue.find(item => item.id === id);
      if (item) {
        item.status = status;
        item.lastAttempt = Date.now();
        if (retryCount !== undefined) {
          item.retryCount = retryCount;
        }
      }
    },
    removeSyncedItems: (state) => {
      state.syncQueue = state.syncQueue.filter(item => item.status !== 'synced');
    },
    clearSyncQueue: (state) => {
      state.syncQueue = [];
      state.pendingItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Check network status
      .addCase(checkNetworkStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload;
      })
      
      // Check sync status
      .addCase(checkSyncStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload.isOnline;
        state.lastSyncTime = new Date(action.payload.lastSyncTime).toISOString();
      })
      
      // Sync data
      .addCase(syncData.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
        state.syncProgress = 0;
      })
      .addCase(syncData.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = new Date().toISOString();
        state.syncProgress = 100;
        state.error = null;
      })
      .addCase(syncData.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
        state.syncProgress = 0;
      })
      
      // Add to sync queue
      .addCase(addToSyncQueue.fulfilled, (state, action) => {
        state.syncQueue.push(action.payload);
        state.pendingItems.push(action.payload);
      })
      
      // Sync pending items
      .addCase(syncPendingItems.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncPendingItems.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = new Date().toISOString();
        
        const results = action.payload;
        // Remove successfully synced items from pending
        const successfulIds = results.filter(r => r.success).map(r => r.id);
        state.pendingItems = state.pendingItems.filter(item => !successfulIds.includes(item.id));
      })
      .addCase(syncPendingItems.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setOnlineStatus, 
  updateSyncItemStatus, 
  removeSyncedItems, 
  clearSyncQueue
} = syncSlice.actions;

export default syncSlice.reducer;