import { apiClient, LoginRequest, OTPVerifyRequest } from './apiClient';
import { secureStorage } from './secureStorage';
import { auditLog } from './auditLog';
import { Patient, Referral } from '../types';

export const authService = {
    sendOTP: async (mobile: string) => {
        try {
            await auditLog.logAuthEvent('otp_request_initiated', 'info', { mobile });
            
            const response = await apiClient.login({ mobile_number: mobile });
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            await auditLog.logAuthEvent('otp_sent_success', 'info', { mobile });
            
            return {
                success: true,
                message: response.data?.message || 'OTP sent successfully',
                data: { mobile }
            };
        } catch (error: any) {
            await auditLog.logAuthEvent('otp_send_failed', 'error', { 
                mobile, 
                error: error.message 
            });
            throw new Error(error.message || 'Failed to send OTP. Please try again.');
        }
    },
    
    verifyOTP: async (mobile: string, otp: string) => {
        try {
            await auditLog.logAuthEvent('otp_verification_initiated', 'info', { mobile });
            
            const response = await apiClient.verifyOTP({ mobile_number: mobile, otp });
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            const { access_token, user } = response.data!;
            
            // Store authentication data securely
            await secureStorage.storeAuthToken(access_token);
            await secureStorage.storeUserData(user);
            
            await auditLog.logAuthEvent('login_success', 'info', { 
                mobile, 
                userId: user.user_id,
                method: 'otp'
            });
            
            return {
                success: true,
                data: {
                    user: {
                        id: user.user_id,
                        name: user.full_name,
                        mobile: user.mobile_number,
                        asha_code: user.asha_code || '',
                        village_code: '', // Will be populated from user profile
                        role: user.role
                    },
                    token: access_token
                }
            };
        } catch (error: any) {
            await auditLog.logAuthEvent('otp_verification_error', 'error', { 
                mobile, 
                error: error.message 
            });
            throw new Error(error.message || 'OTP verification failed');
        }
    },
    
    checkAuth: async () => {
        try {
            // Try secure storage first
            let userData = await secureStorage.getUserData();
            let token = await secureStorage.getAuthToken();
            
            if (token && userData) {
                // Set token in API client
                apiClient.setAccessToken(token);
                
                await auditLog.logAuthEvent('auth_check_success', 'info', { 
                    userId: userData.id,
                    method: 'stored_token'
                });
                return userData;
            }
            
            return null;
        } catch (error: any) {
            await auditLog.logAuthEvent('auth_check_failed', 'warning', { 
                error: error.message 
            });
            return null;
        }
    },
    
    logout: async () => {
        try {
            // Get user data for audit log before clearing
            const userData = await secureStorage.getUserData();
            
            try {
                await apiClient.logout();
            } catch (e) { 
                // Ignore API errors during logout
            }
            
            // Clear all secure storage
            await secureStorage.clearAll();
            
            await auditLog.logAuthEvent('logout_success', 'info', { 
                userId: userData?.id,
                method: 'manual'
            });
        } catch (error: any) {
            await auditLog.logAuthEvent('logout_error', 'error', { 
                error: error.message 
            });
            throw error;
        }
    },
};

export const patientService = {
    getAll: async (): Promise<Patient[]> => {
        const response = await apiClient.getPatients();
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        const patients = response.data?.patients || [];
        return patients.map((p: any) => ({
            ...p,
            id: p.patient_id,
            name: p.full_name,
        }));
    },
    
    create: async (patientData: any): Promise<Patient> => {
        const data = {
            aadhaar_number: patientData.aadhaar_number || '000000000000',
            full_name: patientData.name || patientData.full_name,
            age: patientData.age,
            gender: patientData.gender,
            mobile_number: patientData.mobile_number || patientData.phone || '',
            village_code: patientData.village_code || 'VIL001',
            village_name: patientData.village_name || 'Default Village',
            address: patientData.address || ''
        };
        
        const response = await apiClient.createPatient(data);
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        // Return the created patient (need to fetch it to get full data)
        const patientId = response.data?.patient_id;
        if (patientId) {
            const patientResponse = await apiClient.getPatient(patientId);
            if (patientResponse.data) {
                const p = patientResponse.data;
                return {
                    ...p,
                    id: p.patient_id,
                    name: p.full_name,
                };
            }
        }
        
        // Fallback if we can't fetch the created patient
        return {
            ...data,
            id: patientId || '',
            name: data.full_name,
            patient_id: patientId || '',
            created_by_asha_id: '',
            created_by_asha_name: '',
            created_at: Date.now(),
            updated_at: Date.now()
        };
    },
};

export const referralService = {
    create: async (referralData: any): Promise<Referral> => {
        const response = await apiClient.createReferral(referralData);
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        // Fetch the full referral data
        const referralId = response.data?.referral_id;
        if (referralId) {
            const referralResponse = await apiClient.getReferral(referralId);
            if (referralResponse.data) {
                return referralResponse.data;
            }
        }
        
        // Fallback response
        return {
            referral_id: referralId || '',
            patient_id: referralData.patient_id,
            patient_name: '',
            patient_age: 0,
            patient_gender: '',
            referral_type: referralData.referral_type,
            form_data: referralData.form_data,
            risk_score: response.data?.risk_score || 0,
            risk_level: response.data?.risk_level || 'low',
            risk_factors: [],
            ai_summary: response.data?.ai_summary || '',
            recommendations: [],
            status: 'submitted',
            created_at: Date.now(),
            updated_at: Date.now()
        };
    },
    
    getQueue: async (): Promise<Referral[]> => {
        const response = await apiClient.getReferrals();
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        return response.data?.referrals || [];
    },
};
