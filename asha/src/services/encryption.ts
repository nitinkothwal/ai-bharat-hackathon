import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Note: In a production app, you would use more secure key management
// This is a simplified implementation for demonstration purposes

class EncryptionService {
  private readonly ENCRYPTION_KEY_STORAGE = 'encryption_key';
  private readonly SALT_LENGTH = 16;
  private encryptionKey: string | null = null;

  /**
   * Initialize encryption service with a device-specific key
   */
  async initialize(): Promise<void> {
    try {
      let key = await AsyncStorage.getItem(this.ENCRYPTION_KEY_STORAGE);
      
      if (!key) {
        // Generate a new encryption key
        key = this.generateEncryptionKey();
        await AsyncStorage.setItem(this.ENCRYPTION_KEY_STORAGE, key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Error initializing encryption service:', error);
      throw new Error('Failed to initialize encryption service');
    }
  }

  /**
   * Generate a random encryption key
   */
  private generateEncryptionKey(): string {
    const deviceId = Platform.OS + '_' + Date.now() + '_' + Math.random().toString(36);
    return CryptoJS.SHA256(deviceId).toString();
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    if (!data || data.trim() === '') {
      return '';
    }

    try {
      // Generate a random salt
      const salt = CryptoJS.lib.WordArray.random(this.SALT_LENGTH);
      
      // Derive key using PBKDF2
      const key = CryptoJS.PBKDF2(this.encryptionKey, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });

      // Generate random IV
      const iv = CryptoJS.lib.WordArray.random(16);

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Combine salt + iv + encrypted data
      const combined = salt.concat(iv).concat(encrypted.ciphertext);
      
      return combined.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    if (!encryptedData || encryptedData.trim() === '') {
      return '';
    }

    try {
      // Parse the combined data
      const combined = CryptoJS.enc.Base64.parse(encryptedData);
      
      // Extract salt (first 16 bytes)
      const salt = CryptoJS.lib.WordArray.create(
        combined.words.slice(0, this.SALT_LENGTH / 4)
      );
      
      // Extract IV (next 16 bytes)
      const iv = CryptoJS.lib.WordArray.create(
        combined.words.slice(this.SALT_LENGTH / 4, (this.SALT_LENGTH + 16) / 4)
      );
      
      // Extract encrypted data (remaining bytes)
      const encrypted = CryptoJS.lib.WordArray.create(
        combined.words.slice((this.SALT_LENGTH + 16) / 4)
      );

      // Derive key using PBKDF2
      const key = CryptoJS.PBKDF2(this.encryptionKey, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });

      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encrypted } as any,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data for comparison (one-way)
   */
  hash(data: string): string {
    if (!data || data.trim() === '') {
      return '';
    }

    try {
      return CryptoJS.SHA256(data).toString();
    } catch (error) {
      console.error('Error hashing data:', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Encrypt Aadhaar number with additional validation
   */
  encryptAadhaar(aadhaar: string): string {
    if (!this.isValidAadhaar(aadhaar)) {
      throw new Error('Invalid Aadhaar number format');
    }

    // Remove spaces and encrypt
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    return this.encrypt(cleanAadhaar);
  }

  /**
   * Decrypt Aadhaar number
   */
  decryptAadhaar(encryptedAadhaar: string): string {
    const decrypted = this.decrypt(encryptedAadhaar);
    
    // Format as XXXX XXXX XXXX for display
    if (decrypted && decrypted.length === 12) {
      return decrypted.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    
    return decrypted;
  }

  /**
   * Validate Aadhaar number format
   */
  private isValidAadhaar(aadhaar: string): boolean {
    if (!aadhaar) return false;
    
    // Remove spaces and check if it's 12 digits
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    const aadhaarRegex = /^\d{12}$/;
    
    if (!aadhaarRegex.test(cleanAadhaar)) {
      return false;
    }

    // Basic Aadhaar validation (Verhoeff algorithm would be more accurate)
    // For now, just check that it's not all same digits
    const allSameDigits = /^(\d)\1{11}$/.test(cleanAadhaar);
    return !allSameDigits;
  }

  /**
   * Mask sensitive data for display
   */
  maskAadhaar(aadhaar: string): string {
    if (!aadhaar) return '';
    
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    if (cleanAadhaar.length === 12) {
      return `XXXX XXXX ${cleanAadhaar.slice(-4)}`;
    }
    
    return 'XXXX XXXX XXXX';
  }

  /**
   * Mask mobile number for display
   */
  maskMobile(mobile: string): string {
    if (!mobile) return '';
    
    if (mobile.length === 10) {
      return `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;
    }
    
    return 'XXXXXXXXXX';
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Clear encryption key (for logout)
   */
  async clearEncryptionKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ENCRYPTION_KEY_STORAGE);
      this.encryptionKey = null;
    } catch (error) {
      console.error('Error clearing encryption key:', error);
    }
  }
}

export const encryptionService = new EncryptionService();