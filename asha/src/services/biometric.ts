import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  signature?: string;
}

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType?: BiometryTypes;
  error?: string;
}

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics;
  private readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private readonly BIOMETRIC_KEYS_EXIST_KEY = 'biometric_keys_exist';

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  /**
   * Check if biometric authentication is available on the device
   */
  async isBiometricAvailable(): Promise<BiometricAvailability> {
    if (Platform.OS === 'web') {
      return {
        isAvailable: false,
        error: 'Biometric authentication not supported on web platform',
      };
    }

    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      return {
        isAvailable: available,
        biometryType,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        isAvailable: false,
        error: 'Failed to check biometric availability',
      };
    }
  }

  /**
   * Check if user has enabled biometric authentication in app settings
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.BIOMETRIC_ENABLED_KEY, enabled.toString());
      
      if (enabled) {
        // Create biometric keys if they don't exist
        await this.createBiometricKeys();
      } else {
        // Delete biometric keys if disabled
        await this.deleteBiometricKeys();
      }
    } catch (error) {
      console.error('Error setting biometric enabled status:', error);
      throw new Error('Failed to update biometric settings');
    }
  }

  /**
   * Create biometric keys for authentication
   */
  async createBiometricKeys(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      
      if (!keysExist) {
        const { publicKey } = await this.rnBiometrics.createKeys();
        console.log('Biometric keys created:', publicKey);
        await AsyncStorage.setItem(this.BIOMETRIC_KEYS_EXIST_KEY, 'true');
      }
      
      return true;
    } catch (error) {
      console.error('Error creating biometric keys:', error);
      return false;
    }
  }

  /**
   * Delete biometric keys
   */
  async deleteBiometricKeys(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await this.rnBiometrics.deleteKeys();
      await AsyncStorage.removeItem(this.BIOMETRIC_KEYS_EXIST_KEY);
      console.log('Biometric keys deleted');
    } catch (error) {
      console.error('Error deleting biometric keys:', error);
    }
  }

  /**
   * Authenticate user using biometrics
   */
  async authenticateWithBiometrics(
    promptMessage: string = 'Authenticate to access ASHA app'
  ): Promise<BiometricAuthResult> {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Biometric authentication not supported on web platform',
      };
    }

    try {
      // Check if biometric is available and enabled
      const availability = await this.isBiometricAvailable();
      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.error || 'Biometric authentication not available',
        };
      }

      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is disabled',
        };
      }

      // Check if keys exist
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      if (!keysExist) {
        return {
          success: false,
          error: 'Biometric keys not found. Please re-enable biometric authentication.',
        };
      }

      // Create signature for authentication
      const epochTimeSeconds = Math.round(new Date().getTime() / 1000).toString();
      const payload = `${epochTimeSeconds}`;

      const { success, signature, error } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload,
      });

      if (success && signature) {
        return {
          success: true,
          signature,
        };
      } else {
        return {
          success: false,
          error: error || 'Biometric authentication failed',
        };
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }
  }

  /**
   * Get biometric type name for display
   */
  getBiometricTypeName(biometryType?: BiometryTypes): string {
    switch (biometryType) {
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.Biometrics:
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  }

  /**
   * Check if device credentials (PIN/Pattern/Password) are available
   */
  async isDeviceCredentialAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking device credential availability:', error);
      return false;
    }
  }
}

export const biometricService = new BiometricService();