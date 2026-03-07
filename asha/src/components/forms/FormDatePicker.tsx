import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, HelperText, useTheme } from 'react-native-paper';
import { Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface FormDatePickerProps {
  label: string;
  value: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  style?: any;
  helperText?: string;
  testID?: string;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onDateChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  minimumDate,
  maximumDate,
  mode = 'date',
  style,
  helperText,
  testID,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const displayLabel = required ? `${label} *` : label;
  const hasError = !!error;

  const formatDate = (date: Date | null): string => {
    if (!date) return placeholder || t('common.select_date');
    
    switch (mode) {
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      default:
        return date.toLocaleDateString();
    }
  };

  const handleDatePress = () => {
    if (disabled) return;
    
    if (Platform.OS === 'web') {
      // For web, create a simple date input
      const input = document.createElement('input');
      input.type = mode === 'time' ? 'time' : mode === 'datetime' ? 'datetime-local' : 'date';
      
      if (value) {
        if (mode === 'date') {
          input.value = value.toISOString().split('T')[0];
        } else if (mode === 'time') {
          input.value = value.toTimeString().slice(0, 5);
        } else {
          input.value = value.toISOString().slice(0, 16);
        }
      }
      
      if (minimumDate) {
        input.min = minimumDate.toISOString().split('T')[0];
      }
      
      if (maximumDate) {
        input.max = maximumDate.toISOString().split('T')[0];
      }
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          const newDate = new Date(target.value);
          onDateChange(newDate);
        } else {
          onDateChange(null);
        }
      };
      
      input.click();
    } else {
      // For native platforms, you would use a proper date picker
      // For now, we'll use a simple implementation
      setShowPicker(true);
      
      // Mock date picker - in a real app, use @react-native-community/datetimepicker
      const mockDate = new Date();
      onDateChange(mockDate);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text variant="bodyMedium" style={[
        styles.label,
        hasError && { color: theme.colors.error },
        disabled && { opacity: 0.6 }
      ]}>
        {displayLabel}
      </Text>
      
      <Button
        mode="outlined"
        onPress={handleDatePress}
        disabled={disabled}
        style={[
          styles.button,
          hasError && { borderColor: theme.colors.error },
        ]}
        contentStyle={styles.buttonContent}
        labelStyle={[
          styles.buttonLabel,
          !value && styles.placeholderText,
          hasError && { color: theme.colors.error },
        ]}
        icon={({ size, color }) => (
          <Calendar 
            size={size} 
            color={disabled ? theme.colors.outline : color} 
          />
        )}
        testID={testID}
      >
        {formatDate(value)}
      </Button>

      {(error || helperText) && (
        <HelperText 
          type={hasError ? 'error' : 'info'} 
          visible={true}
          style={styles.helperText}
        >
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    justifyContent: 'flex-start',
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'left',
    marginLeft: 8,
  },
  placeholderText: {
    opacity: 0.6,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
});