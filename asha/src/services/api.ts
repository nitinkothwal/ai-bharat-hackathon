import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Patient, Referral } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        // Server uses cookies for web, but we might still use tokens for mobile
        // response.data is the ApiResponse { success, data, message }
        const data = response.data.data;
        if (data && data.token) {
            await AsyncStorage.setItem('auth_token', data.token);
        } else {
            // For cookie-based auth, we just need to know we are logged in
            await AsyncStorage.setItem('is_logged_in', 'true');
        }
        return data;
    },
    checkAuth: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data.data?.user;
        } catch (error) {
            return null;
        }
    },
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { }
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('is_logged_in');
    },
};

export const patientService = {
    getAll: async (): Promise<Patient[]> => {
        const response = await api.get('/patients');
        const patients = response.data.data?.patients || [];
        return patients.map((p: any) => ({
            ...p,
            id: p.patient_id,
            name: p.full_name,
        }));
    },
    create: async (patientData: any): Promise<Patient> => {
        // Ensure required fields for backend are present
        const data = {
            ...patientData,
            full_name: patientData.name,
            village_code: patientData.village_code || 'VIL001', // Mock or get from user context
            created_by_asha_id: patientData.asha_id || 'ASH001', // Mock or get from user context
        };
        const response = await api.post('/patients', data);
        const p = response.data.data?.patient;
        return {
            ...p,
            id: p.patient_id,
            name: p.full_name,
        };
    },
};

export const referralService = {
    create: async (referralData: Partial<Referral>): Promise<Referral> => {
        const response = await api.post('/referrals', referralData);
        return response.data.data?.referral;
    },
    getQueue: async (): Promise<Referral[]> => {
        const response = await api.get('/referrals');
        return response.data.data?.referrals || [];
    },
};

export default api;
