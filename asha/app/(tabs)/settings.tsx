import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Divider, useTheme, Avatar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { logout } from '../../src/store/slices/authSlice';
import LanguageSelector from '../../src/components/LanguageSelector';
import { BiometricAuth } from '../../src/components/BiometricAuth';
import { User, Globe, Info, LogOut, Shield, Bell, Fingerprint } from 'lucide-react-native';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector(state => state.auth);

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logout_confirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            router.replace('/auth/otp-login');
          },
        },
      ]
    );
  };

  const handleBiometricAuthSuccess = () => {
    // Biometric settings updated successfully
  };

  const handleBiometricAuthError = (error: string) => {
    Alert.alert(t('common.error'), error);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Section */}
      <Card style={styles.profileCard} mode="outlined">
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={64} 
              label={user?.name?.charAt(0) || 'A'} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={styles.userName}>
                {user?.name || 'ASHA Worker'}
              </Text>
              <Text variant="bodyMedium" style={styles.userRole}>
                {t('app.subtitle')}
              </Text>
              <Text variant="bodySmall" style={styles.userDetails}>
                {t('settings.asha_code')}: {user?.asha_code || 'ASH001'}
              </Text>
              <Text variant="bodySmall" style={styles.userDetails}>
                {t('settings.village')}: {user?.village_code || 'VIL001'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Settings Sections */}
      <Card style={styles.settingsCard} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.preferences')}
          </Text>
          
          <List.Section>
            <List.Item
              title={t('settings.language')}
              description={t('settings.language_description')}
              left={(props) => <List.Icon {...props} icon={() => <Globe size={24} color={theme.colors.primary} />} />}
              right={() => (
                <View style={styles.languageSelectorContainer}>
                  <LanguageSelector showLabel={false} variant="menu" />
                </View>
              )}
            />
            
            <Divider />
            
            <List.Item
              title={t('settings.notifications')}
              description={t('settings.notifications_description')}
              left={(props) => <List.Icon {...props} icon={() => <Bell size={24} color={theme.colors.primary} />} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to notifications settings
              }}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.settingsCard} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.account')}
          </Text>
          
          <List.Section>
            <List.Item
              title={t('settings.profile')}
              description={t('settings.profile_description')}
              left={(props) => <List.Icon {...props} icon={() => <User size={24} color={theme.colors.primary} />} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to profile settings
              }}
            />
            
            <Divider />
            
            <List.Item
              title={t('settings.security')}
              description={t('settings.security_description')}
              left={(props) => <List.Icon {...props} icon={() => <Shield size={24} color={theme.colors.primary} />} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to security settings
              }}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Biometric Authentication Settings */}
      <Card style={styles.settingsCard} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.security')}
          </Text>
          
          <BiometricAuth
            onAuthSuccess={handleBiometricAuthSuccess}
            onAuthError={handleBiometricAuthError}
            showSettings={true}
          />
        </Card.Content>
      </Card>

      <Card style={styles.settingsCard} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.support')}
          </Text>
          
          <List.Section>
            <List.Item
              title={t('settings.help')}
              description={t('settings.help_description')}
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to help
              }}
            />
            
            <Divider />
            
            <List.Item
              title={t('settings.about')}
              description={t('settings.version', { version: '1.0.0' })}
              left={(props) => <List.Icon {...props} icon={() => <Info size={24} color={theme.colors.primary} />} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to about
              }}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Logout Section */}
      <Card style={[styles.settingsCard, styles.logoutCard]} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <List.Section>
            <List.Item
              title={t('settings.logout')}
              description={t('settings.logout_description')}
              left={(props) => <List.Icon {...props} icon={() => <LogOut size={24} color={theme.colors.error} />} />}
              titleStyle={{ color: theme.colors.error }}
              onPress={handleLogout}
            />
          </List.Section>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  userRole: {
    color: '#666',
    marginBottom: 8,
  },
  userDetails: {
    color: '#999',
    marginBottom: 2,
  },
  settingsCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  cardContent: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
  },
  languageSelectorContainer: {
    marginRight: -8,
  },
  logoutCard: {
    borderColor: '#ffebee',
  },
});