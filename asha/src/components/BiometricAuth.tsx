import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Switch, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { biometricService, BiometricAvailability } from '../services/biometric';

interface BiometricAuthProps {
  onAuthSuccess: (signature?: string) => void;
  onAuthError: (error: string) => void;
  showSettings?: boolean;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthSuccess,
  onAuthError,
  showSettings = false,
}) => {
  const { t } = useTranslation();
  const [availability, setAvailability] = useState<BiometricAvailability>({ isAvailable: false });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const availability = await biometricService.isBiometricAvailable();
      const enabled = await biometricService.isBiometricEnabled();
      
      setAvailability(availability);
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      
      if (enabled) {
        // Show confirmation dialog before enabling
        Alert.alert(
          t('biometric.enable_title'),
          t('biometric.enable_message'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.enable'),
              onPress: async () => {
                try {
                  await biometricService.setBiometricEnabled(true);
                  setIsEnabled(true);
                  Alert.alert(
                    t('biometric.enabled_title'),
                    t('biometric.enabled_message')
                  );
                } catch (error) {
                  onAuthError(t('biometric.enable_error'));
                }
              },
            },
          ]
        );
      } else {
        // Disable biometric authentication
        await biometricService.setBiometricEnabled(false);
        setIsEnabled(false);
        Alert.alert(
          t('biometric.disabled_title'),
          t('biometric.disabled_message')
        );
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      onAuthError(t('biometric.toggle_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      
      const result = await biometricService.authenticateWithBiometrics(
        t('biometric.auth_prompt')
      );
      
      if (result.success) {
        onAuthSuccess(result.signature);
      } else {
        onAuthError(result.error || t('biometric.auth_failed'));
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      onAuthError(t('biometric.auth_error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!availability.isAvailable) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.unavailableText}>
            {t('biometric.not_available')}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const biometricTypeName = biometricService.getBiometricTypeName(availability.biometryType);

  return (
    <View style={styles.container}>
      {showSettings && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text variant="titleMedium">
                  {t('biometric.enable_auth', { type: biometricTypeName })}
                </Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  {t('biometric.enable_description')}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleBiometricToggle}
                disabled={isLoading}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {isEnabled && !showSettings && (
        <Card style={styles.card}>
          <Card.Content style={styles.authContent}>
            <Text variant="titleMedium" style={styles.authTitle}>
              {t('biometric.quick_access')}
            </Text>
            <Text variant="bodyMedium" style={styles.authDescription}>
              {t('biometric.quick_access_description', { type: biometricTypeName })}
            </Text>
            <Button
              mode="contained"
              onPress={handleBiometricAuth}
              loading={isLoading}
              disabled={isLoading}
              style={styles.authButton}
              icon="fingerprint"
            >
              {t('biometric.authenticate', { type: biometricTypeName })}
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    marginVertical: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  unavailableText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  authContent: {
    alignItems: 'center',
  },
  authTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  authDescription: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  authButton: {
    minWidth: 200,
  },
});