import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../i18n';
import { Languages } from 'lucide-react-native';

interface LanguageSelectorProps {
  showLabel?: boolean;
  variant?: 'button' | 'menu';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showLabel = true,
  variant = 'button'
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      await AsyncStorage.setItem('user_language', languageCode);
      setVisible(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  if (variant === 'menu') {
    return (
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            icon={() => <Languages size={20} color={theme.colors.primary} />}
            contentStyle={styles.buttonContent}
          >
            {currentLanguage?.name || 'Language'}
          </Button>
        }
        contentStyle={styles.menuContent}
      >
        {SUPPORTED_LANGUAGES.map((language, index) => (
          <View key={language.code}>
            <Menu.Item
              onPress={() => handleLanguageChange(language.code)}
              title={language.name}
              titleStyle={[
                styles.menuItemTitle,
                i18n.language === language.code && { color: theme.colors.primary }
              ]}
              leadingIcon={i18n.language === language.code ? "check" : undefined}
            />
            {index < SUPPORTED_LANGUAGES.length - 1 && <Divider />}
          </View>
        ))}
      </Menu>
    );
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text variant="bodyMedium" style={styles.label}>
          {t('settings.language')}
        </Text>
      )}
      
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            icon={() => <Languages size={20} color={theme.colors.primary} />}
            contentStyle={styles.buttonContent}
            style={styles.languageButton}
          >
            {currentLanguage?.name || 'Language'}
          </Button>
        }
        contentStyle={styles.menuContent}
      >
        {SUPPORTED_LANGUAGES.map((language, index) => (
          <View key={language.code}>
            <Menu.Item
              onPress={() => handleLanguageChange(language.code)}
              title={language.name}
              titleStyle={[
                styles.menuItemTitle,
                i18n.language === language.code && { color: theme.colors.primary }
              ]}
              leadingIcon={i18n.language === language.code ? "check" : undefined}
            />
            {index < SUPPORTED_LANGUAGES.length - 1 && <Divider />}
          </View>
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  languageButton: {
    alignSelf: 'flex-start',
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 8,
  },
  menuContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItemTitle: {
    fontSize: 16,
  },
});

export default LanguageSelector;