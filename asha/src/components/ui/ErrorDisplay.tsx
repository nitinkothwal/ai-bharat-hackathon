import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface ErrorDisplayProps {
  error: string | Error;
  type?: 'network' | 'validation' | 'server' | 'generic';
  onRetry?: () => void;
  onDismiss?: () => void;
  showIcon?: boolean;
  style?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type = 'generic',
  onRetry,
  onDismiss,
  showIcon = true,
  style,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const errorMessage = typeof error === 'string' ? error : error.message;

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff size={24} color={theme.colors.error} />;
      case 'server':
        return <AlertTriangle size={24} color={theme.colors.error} />;
      default:
        return <AlertTriangle size={24} color={theme.colors.error} />;
    }
  };

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return t('common.network_error');
      case 'validation':
        return t('common.validation_error');
      case 'server':
        return t('common.server_error');
      default:
        return t('common.error');
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'network':
        return t('common.network_error_message');
      case 'validation':
        return t('common.validation_error_message');
      case 'server':
        return t('common.server_error_message');
      default:
        return t('common.generic_error_message');
    }
  };

  return (
    <Card style={[styles.container, style]} mode="outlined">
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          {showIcon && (
            <View style={styles.iconContainer}>
              {getErrorIcon()}
            </View>
          )}
          <View style={styles.textContainer}>
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.error }]}>
              {getErrorTitle()}
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              {errorMessage || getDefaultMessage()}
            </Text>
          </View>
        </View>

        {(onRetry || onDismiss) && (
          <View style={styles.actions}>
            {onRetry && (
              <Button
                mode="contained"
                onPress={onRetry}
                icon={() => <RefreshCw size={16} color="white" />}
                style={styles.retryButton}
                buttonColor={theme.colors.error}
              >
                {t('common.retry')}
              </Button>
            )}
            {onDismiss && (
              <Button
                mode="text"
                onPress={onDismiss}
                style={styles.dismissButton}
                textColor={theme.colors.error}
              >
                {t('common.dismiss')}
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// Inline error component for forms
interface InlineErrorProps {
  error: string;
  visible?: boolean;
  style?: any;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  error,
  visible = true,
  style,
}) => {
  const theme = useTheme();

  if (!visible || !error) return null;

  return (
    <View style={[styles.inlineContainer, style]}>
      <AlertTriangle size={16} color={theme.colors.error} />
      <Text 
        variant="bodySmall" 
        style={[styles.inlineText, { color: theme.colors.error }]}
      >
        {error}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  retryButton: {
    minWidth: 100,
  },
  dismissButton: {
    minWidth: 80,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  inlineText: {
    marginLeft: 6,
    fontSize: 12,
  },
});