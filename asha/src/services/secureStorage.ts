import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptionService } from './encryption';

/**
 * Secure storage service for sensitive data like authentication tokens
 * Uses encryption for additional security layer
 */
class SecureStorageService {
  private readonly TOKEN_KEY = 'secure_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'secure_refresh_token';
  private readonly USER_DATA_KEY = 'secure_user_data';
  private readonly SESSION_DATA_KEY = 'secure_session_data';
  private readonly BIOMETRIC_DATA_KEY = 'secure_biometric_data';

  /**
   * Initialize secure storage
   */
  async initialize(): Promise<void> {
    try {
      await encryptionService.initialize();
    } catch (error) {
      console.error('Error initializing secure storage:', error);
      throw new Error('Failed to initialize secure storage');
    }
  }

  /**
   * Store authentication token securely
   */
  async storeAuthToken(token: string): Promise<void> {
    try {
      const encryptedToken = encryptionService.encrypt(token);
      await AsyncStorage.setItem(this.TOKEN_KEY, encryptedToken);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Retrieve authentication token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const encryptedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (!encryptedToken) {
        return null;
      }
      
      return encryptionService.decrypt(encryptedToken);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  /**
   * Store refresh token securely
   */
  async storeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const encryptedToken = encryptionService.encrypt(refreshToken);
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedToken);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const encryptedToken = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!encryptedToken) {
        return null;
      }
      
      return encryptionService.decrypt(encryptedToken);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  /**
   * Store user data securely
   */
  async storeUserData(userData: any): Promise<void> {
    try {
      const userDataString = JSON.stringify(userData);
      const encryptedData = encryptionService.encrypt(userDataString);
      await AsyncStorage.setItem(this.USER_DATA_KEY, encryptedData);
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve user data
   */
  async getUserData(): Promise<any | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Store session data with expiration
   */
  async storeSessionData(sessionData: any, expirationMinutes: number = 60): Promise<void> {
    try {
      const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
      const dataWithExpiration = {
        ...sessionData,
        expiresAt: expirationTime,
      };
      
      const dataString = JSON.stringify(dataWithExpiration);
      const encryptedData = encryptionService.encrypt(dataString);
      await AsyncStorage.setItem(this.SESSION_DATA_KEY, encryptedData);
    } catch (error) {
      console.error('Error storing session data:', error);
      throw new Error('Failed to store session data');
    }
  }

  /**
   * Retrieve session data (returns null if expired)
   */
  async getSessionData(): Promise<any | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.SESSION_DATA_KEY);
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = encryptionService.decrypt(encryptedData);
      const sessionData = JSON.parse(decryptedData);
      
      // Check if session has expired
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        await this.clearSessionData();
        return null;
      }
      
      // Remove expiration field before returning
      const { expiresAt, ...cleanSessionData } = sessionData;
      return cleanSessionData;
    } catch (error) {
      console.error('Error retrieving session data:', error);
      return null;
    }
  }

  /**
   * Store biometric authentication data
   */
  async storeBiometricData(biometricData: any): Promise<void> {
    try {
      const dataString = JSON.stringify(biometricData);
      const encryptedData = encryptionService.encrypt(dataString);
      await AsyncStorage.setItem(this.BIOMETRIC_DATA_KEY, encryptedData);
    } catch (error) {
      console.error('Error storing biometric data:', error);
      throw new Error('Failed to store biometric data');
    }
  }

  /**
   * Retrieve biometric authentication data
   */
  async getBiometricData(): Promise<any | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.BIOMETRIC_DATA_KEY);
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error retrieving biometric data:', error);
      return null;
    }
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.TOKEN_KEY),
        AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  /**
   * Clear user data
   */
  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Clear session data
   */
  async clearSessionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_DATA_KEY);
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  /**
   * Clear biometric data
   */
  async clearBiometricData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BIOMETRIC_DATA_KEY);
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }

  /**
   * Clear all secure storage data
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearAuthTokens(),
        this.clearUserData(),
        this.clearSessionData(),
        this.clearBiometricData(),
        encryptionService.clearEncryptionKey(),
      ]);
    } catch (error) {
      console.error('Error clearing all secure storage:', error);
    }
  }

  /**
   * Check if authentication tokens exist
   */
  async hasAuthTokens(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      console.error('Error checking auth tokens:', error);
      return false;
    }
  }

  /**
   * Validate token format (basic validation)
   */
  validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Basic JWT format check (header.payload.signature)
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    hasAuthToken: boolean;
    hasRefreshToken: boolean;
    hasUserData: boolean;
    hasSessionData: boolean;
    hasBiometricData: boolean;
  }> {
    try {
      const [authToken, refreshToken, userData, sessionData, biometricData] = await Promise.all([
        AsyncStorage.getItem(this.TOKEN_KEY),
        AsyncStorage.getItem(this.REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(this.USER_DATA_KEY),
        AsyncStorage.getItem(this.SESSION_DATA_KEY),
        AsyncStorage.getItem(this.BIOMETRIC_DATA_KEY),
      ]);

      return {
        hasAuthToken: !!authToken,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData,
        hasSessionData: !!sessionData,
        hasBiometricData: !!biometricData,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        hasAuthToken: false,
        hasRefreshToken: false,
        hasUserData: false,
        hasSessionData: false,
        hasBiometricData: false,
      };
    }
  }
}

export const secureStorage = new SecureStorageService();