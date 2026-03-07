import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  overlay?: boolean;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  message,
  overlay = false,
  style,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const spinnerColor = color || theme.colors.primary;
  const displayMessage = message || t('common.loading');

  if (overlay) {
    return (
      <View style={[styles.overlay, style]}>
        <View style={styles.overlayContent}>
          <ActivityIndicator 
            size={size} 
            color={spinnerColor}
            style={styles.spinner}
          />
          {displayMessage && (
            <Text 
              variant="bodyMedium" 
              style={[styles.message, { color: theme.colors.onSurface }]}
            >
              {displayMessage}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={spinnerColor}
        style={styles.spinner}
      />
      {displayMessage && (
        <Text 
          variant="bodyMedium" 
          style={[styles.message, { color: theme.colors.onSurface }]}
        >
          {displayMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
  },
});