// API Client for Bharat CareLink Mobile App

import { apiConfig, endpoints, HTTP_STATUS, REQUEST_TIMEOUT, RETRY_CONFIG } from '../config/api';
import { secureStorage } from './secureStorage';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface LoginRequest {
  mobile_number: string;
}

export interface OTPVerifyRequest {
  mobile_number: string;
  otp: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    user_id: string;
    full_name: string;
    role: string;
    mobile_number: string;
    asha_code?: string;
    phc_code?: string;
  };
}

export interface Patient {
  patient_id: string;
  aadhaar_number: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile_number: string;
  village_code: string;
  village_name: string;
  address: string;
  created_by_asha_id: string;
  created_by_asha_name: string;
  created_at: number;
  updated_at: number;
}

export interface CreatePatientRequest {
  aadhaar_number: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile_number: string;
  village_code: string;
  village_name: string;
  address: string;
}

export interface Referral {
  referral_id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  referral_type: 'pregnancy' | 'malnutrition' | 'tb_suspect' | 'chronic_disease';
  form_data: Record<string, any>;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: Array<{
    factor: string;
    contribution: number;
    value: any;
    severity: string;
  }>;
  ai_summary: string;
  recommendations: string[];
  status: string;
  created_at: number;
  updated_at: number;
}

export interface CreateReferralRequest {
  patient_id: string;
  referral_type: 'pregnancy' | 'malnutrition' | 'tb_suspect' | 'chronic_disease';
  form_data: Record<string, any>;
  geolocation?: {
    lat: number;
    lon: number;
  };
}

class APIClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = apiConfig.baseURL;
    // Don't call loadAccessToken in constructor since it's async
    // It will be called when needed in makeRequest
  }

  private async ensureTokenLoaded(): Promise<void> {
    if (this.accessToken === null) {
      await this.loadAccessToken();
    }
  }

  private async loadAccessToken(): Promise<void> {
    try {
      this.accessToken = await secureStorage.getAuthToken();
    } catch (error) {
      console.error('Error loading access token:', error);
    }
  }

  private async saveAccessToken(token: string): Promise<void> {
    try {
      this.accessToken = token;
      await secureStorage.storeAuthToken(token);
    } catch (error) {
      console.error('Error saving access token:', error);
    }
  }

  private async clearAccessToken(): Promise<void> {
    try {
      this.accessToken = null;
      await secureStorage.clearAuthTokens();
    } catch (error) {
      console.error('Error clearing access token:', error);
    }
  }

  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (includeAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    includeAuth: boolean = true,
    retryCount: number = 0
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Ensure token is loaded before making authenticated requests
      if (includeAuth) {
        await this.ensureTokenLoaded();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method,
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (response.ok) {
        return {
          data: responseData,
          statusCode: response.status
        };
      } else {
        // Handle 401 Unauthorized - token expired
        if (response.status === HTTP_STATUS.UNAUTHORIZED && includeAuth) {
          await this.clearAccessToken();
          // Could trigger re-authentication flow here
        }

        return {
          error: responseData.error || 'Request failed',
          message: responseData.message,
          statusCode: response.status
        };
      }
    } catch (error: any) {
      console.error(`API request failed: ${method} ${url}`, error);

      // Retry logic for network errors
      if (retryCount < RETRY_CONFIG.maxRetries && this.shouldRetry(error)) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryDelayMultiplier, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(method, endpoint, data, includeAuth, retryCount + 1);
      }

      return {
        error: error.message || 'Network error',
        statusCode: 0
      };
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    );
  }

  // Authentication methods
  async login(request: LoginRequest): Promise<APIResponse<{ message: string; mobile_number: string; otp_id: string }>> {
    return this.makeRequest('POST', endpoints.auth.login, request, false);
  }

  async verifyOTP(request: OTPVerifyRequest): Promise<APIResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('POST', endpoints.auth.otpVerify, request, false);
    
    if (response.data?.access_token) {
      await this.saveAccessToken(response.data.access_token);
    }
    
    return response;
  }

  async logout(): Promise<APIResponse<{ message: string }>> {
    const response = await this.makeRequest('POST', endpoints.auth.logout, {});
    await this.clearAccessToken();
    return response;
  }

  async refreshToken(): Promise<APIResponse<{ access_token: string }>> {
    // Implementation depends on refresh token strategy
    return { statusCode: 501, error: 'Not implemented' };
  }

  // Patient methods
  async getPatients(params?: {
    asha_id?: string;
    village_code?: string;
    limit?: number;
    last_key?: string;
    search?: string;
  }): Promise<APIResponse<{ patients: Patient[]; count: number; next_key?: string }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${endpoints.patients.list}?${queryParams.toString()}`;
    return this.makeRequest('GET', endpoint);
  }

  async getPatient(patientId: string): Promise<APIResponse<Patient>> {
    return this.makeRequest('GET', endpoints.patients.get(patientId));
  }

  async createPatient(patient: CreatePatientRequest): Promise<APIResponse<{ patient_id: string; message: string }>> {
    return this.makeRequest('POST', endpoints.patients.create, patient);
  }

  async updatePatient(patientId: string, updates: Partial<CreatePatientRequest>): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('PUT', endpoints.patients.update(patientId), updates);
  }

  // Referral methods
  async getReferrals(params?: {
    asha_id?: string;
    phc_code?: string;
    status?: string;
    limit?: number;
    last_key?: string;
  }): Promise<APIResponse<{ referrals: Referral[]; count: number; next_key?: string }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${endpoints.referrals.list}?${queryParams.toString()}`;
    return this.makeRequest('GET', endpoint);
  }

  async getReferral(referralId: string): Promise<APIResponse<Referral>> {
    return this.makeRequest('GET', endpoints.referrals.get(referralId));
  }

  async createReferral(referral: CreateReferralRequest): Promise<APIResponse<{
    referral_id: string;
    risk_score: number;
    risk_level: string;
    ai_summary: string;
    message: string;
  }>> {
    return this.makeRequest('POST', endpoints.referrals.create, referral);
  }

  async updateReferralStatus(referralId: string, status: string, notes?: string): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('PUT', endpoints.referrals.updateStatus(referralId), { status, notes });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async getAccessToken(): Promise<string | null> {
    await this.ensureTokenLoaded();
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;