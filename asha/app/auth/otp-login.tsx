import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, HelperText, Divider } from 'react-native-paper';
import type { TextInput as TextInputType } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { sendOTP, verifyOTP, clearError, loginSuccess } from '../../src/store/slices/authSlice';
import { Smartphone, Shield } from 'lucide-react-native';
import LanguageSelector from '../../src/components/LanguageSelector';
import { BiometricAuth } from '../../src/components/BiometricAuth';
import { biometricService } from '../../src/services/biometric';

export default function OTPLoginScreen() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [showBiometric, setShowBiometric] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  
  const { isLoading, error, otpSent, isAuthenticated } = useAppSelector(state => state.auth);
  
  const otpRefs = useRef<Array<TextInputType | null>>([]);

  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to prevent navigation conflicts
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Check if biometric is available and enabled
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const availability = await biometricService.isBiometricAvailable();
      const isEnabled = await biometricService.isBiometricEnabled();
      setShowBiometric(availability.isAvailable && isEnabled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const handleBiometricAuth = async (signature?: string) => {
    try {
      // Mock successful authentication with biometric
      // In a real app, you would validate the signature with your backend
      const mockUser = {
        id: 'asha_001',
        name: 'ASHA Worker',
        mobile: '9876543210',
        asha_id: 'ASH001',
        village_code: 'VIL001',
        village_name: 'Sample Village',
      };
      
      dispatch(loginSuccess({ user: mockUser, token: 'biometric_token_' + Date.now() }));
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
  };

  const handleBiometricError = (error: string) => {
    Alert.alert(t('common.error'), error);
  };

  const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handleSendOTP = async () => {
    if (!validateMobile(mobile)) {
      Alert.alert(t('validation.invalid_mobile'), t('auth.invalid_mobile'));
      return;
    }

    dispatch(clearError());
    const result = await dispatch(sendOTP(mobile));
    
    if (sendOTP.fulfilled.match(result)) {
      setStep('otp');
      Alert.alert(t('auth.otp_sent'), t('auth.otp_sent', { mobile }));
    } else {
      Alert.alert(t('common.error'), error || t('auth.send_otp_failed'));
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert(t('validation.invalid_otp'), t('auth.invalid_otp'));
      return;
    }

    dispatch(clearError());
    const result = await dispatch(verifyOTP({ mobile, otp: otpToVerify }));
    
    if (verifyOTP.fulfilled.match(result)) {
      // Don't navigate here - let the useEffect handle it when isAuthenticated changes
      // router.replace('/(tabs)');
    } else {
      Alert.alert(t('validation.invalid_otp'), error || t('auth.otp_verification_failed'));
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    handleSendOTP();
  };

  const renderMobileStep = () => (
    <View>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Smartphone color="white" size={32} />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          {t('app.name')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('app.subtitle')}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {t('auth.enter_mobile')}
        </Text>
      </View>

      <Surface style={styles.form} elevation={1}>
        <TextInput
          label={t('auth.mobile_number')}
          value={mobile}
          onChangeText={setMobile}
          mode="outlined"
          keyboardType="phone-pad"
          maxLength={10}
          left={<TextInput.Affix text="+91" />}
          style={styles.input}
          error={mobile.length > 0 && !validateMobile(mobile)}
        />
        
        <HelperText type="info" visible={true}>
          {t('auth.mobile_helper')}
        </HelperText>

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSendOTP}
          loading={isLoading}
          disabled={isLoading || !validateMobile(mobile)}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('auth.send_otp')}
        </Button>
      </Surface>

      {showBiometric && (
        <>
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>
              {t('common.or')}
            </Text>
            <Divider style={styles.divider} />
          </View>

          <BiometricAuth
            onAuthSuccess={handleBiometricAuth}
            onAuthError={handleBiometricError}
            showSettings={false}
          />
        </>
      )}
    </View>
  );

  const renderOTPStep = () => (
    <View>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Shield color="white" size={32} />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          {t('auth.verify_otp')}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {t('auth.enter_otp', { mobile })}
        </Text>
      </View>

      <Surface style={styles.form} elevation={1}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInputType | null) => (otpRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
              mode="outlined"
              keyboardType="numeric"
              maxLength={1}
              style={styles.otpInput}
              contentStyle={styles.otpInputContent}
              textAlign="center"
            />
          ))}
        </View>

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={() => handleVerifyOTP()}
          loading={isLoading}
          disabled={isLoading || otp.some(digit => digit === '')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('auth.verify_login')}
        </Button>

        <Button
          mode="text"
          onPress={handleResendOTP}
          disabled={isLoading}
          style={styles.resendButton}
        >
          {t('auth.resend_otp')}
        </Button>

        <Button
          mode="text"
          onPress={() => {
            setStep('mobile');
            setOtp(['', '', '', '', '', '']);
            dispatch(clearError());
          }}
          style={styles.backButton}
        >
          {t('auth.change_mobile')}
        </Button>
      </Surface>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.languageSelectorContainer}>
          <LanguageSelector variant="menu" showLabel={false} />
        </View>
        
        {step === 'mobile' ? renderMobileStep() : renderOTPStep()}

        <Text variant="bodySmall" style={styles.footer}>
          {t('app.tagline')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#006B5E',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  form: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  input: {
    marginBottom: 8,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
  },
  otpInputContent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.5,
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.6,
  },
});