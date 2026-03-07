// API Configuration for Bharat CareLink Mobile App

export interface APIConfig {
  baseURL: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cognitoIdentityPoolId: string;
  region: string;
  s3AudioBucket: string;
  s3ReferralsBucket: string;
}

// Environment-specific configurations
const configs: Record<string, APIConfig> = {
  development: {
    baseURL: 'https://al3mct64tk.execute-api.ap-south-1.amazonaws.com/v1',
    cognitoUserPoolId: 'ap-south-1_paCpWqHTk',
    cognitoClientId: '7l4ceg8l3agqradrbnappet167',
    cognitoIdentityPoolId: 'ap-south-1:ed9916af-672b-44b7-a9bf-7be642dc6e66',
    region: 'ap-south-1',
    s3AudioBucket: 'bharat-carelink-audio-input-771354139195',
    s3ReferralsBucket: 'bharat-carelink-referral-pdfs-771354139195'
  },
  staging: {
    baseURL: 'https://al3mct64tk.execute-api.ap-south-1.amazonaws.com/v1',
    cognitoUserPoolId: 'ap-south-1_paCpWqHTk',
    cognitoClientId: '7l4ceg8l3agqradrbnappet167',
    cognitoIdentityPoolId: 'ap-south-1:ed9916af-672b-44b7-a9bf-7be642dc6e66',
    region: 'ap-south-1',
    s3AudioBucket: 'bharat-carelink-audio-input-771354139195',
    s3ReferralsBucket: 'bharat-carelink-referral-pdfs-771354139195'
  },
  production: {
    baseURL: 'https://al3mct64tk.execute-api.ap-south-1.amazonaws.com/v1',
    cognitoUserPoolId: 'ap-south-1_paCpWqHTk',
    cognitoClientId: '7l4ceg8l3agqradrbnappet167',
    cognitoIdentityPoolId: 'ap-south-1:ed9916af-672b-44b7-a9bf-7be642dc6e66',
    region: 'ap-south-1',
    s3AudioBucket: 'bharat-carelink-audio-input-771354139195',
    s3ReferralsBucket: 'bharat-carelink-referral-pdfs-771354139195'
  }
};

// Get current environment from process.env or default to development
const environment = process.env.NODE_ENV || 'development';

export const apiConfig: APIConfig = configs[environment] || configs.development;

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    otpVerify: '/auth/otp-verify',
    refresh: '/auth/refresh',
    logout: '/auth/logout'
  },
  
  // Patients
  patients: {
    list: '/patients',
    create: '/patients',
    get: (id: string) => `/patients/${id}`,
    update: (id: string) => `/patients/${id}`,
    delete: (id: string) => `/patients/${id}`
  },
  
  // Referrals
  referrals: {
    list: '/referrals',
    create: '/referrals',
    get: (id: string) => `/referrals/${id}`,
    update: (id: string) => `/referrals/${id}`,
    updateStatus: (id: string) => `/referrals/${id}/status`
  },
  
  // Follow-ups
  followUps: {
    list: '/follow-ups',
    create: '/follow-ups',
    complete: (id: string) => `/follow-ups/${id}/complete`
  },
  
  // Voice/Audio
  voice: {
    upload: '/voice/upload',
    transcribe: '/voice/transcribe',
    getTranscription: (jobId: string) => `/voice/transcription/${jobId}`
  },
  
  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    heatmap: '/analytics/heatmap',
    reports: '/analytics/reports'
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryDelayMultiplier: 2
};

// Offline sync configuration
export const SYNC_CONFIG = {
  maxOfflineRecords: 500,
  syncIntervalMs: 5 * 60 * 1000, // 5 minutes
  maxSyncBatchSize: 50
};

export default apiConfig;