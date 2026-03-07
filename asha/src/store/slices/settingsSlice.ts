import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number; // in minutes
    wifiOnly: boolean;
  };
  voice: {
    enabled: boolean;
    language: string;
    confidenceThreshold: number;
  };
}

const initialState: SettingsState = {
  language: 'hi', // Default to Hindi
  theme: 'light',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  sync: {
    autoSync: true,
    syncInterval: 15, // 15 minutes
    wifiOnly: false,
  },
  voice: {
    enabled: true,
    language: 'hi-IN',
    confidenceThreshold: 0.85,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateSyncSettings: (state, action: PayloadAction<Partial<SettingsState['sync']>>) => {
      state.sync = { ...state.sync, ...action.payload };
    },
    updateVoiceSettings: (state, action: PayloadAction<Partial<SettingsState['voice']>>) => {
      state.voice = { ...state.voice, ...action.payload };
    },
    resetSettings: (state) => {
      return initialState;
    },
  },
});

export const {
  setLanguage,
  setTheme,
  updateNotificationSettings,
  updateSyncSettings,
  updateVoiceSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;