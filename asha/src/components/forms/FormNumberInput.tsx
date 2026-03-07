import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText, IconButton, useTheme } from 'react-native-paper';
import { Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface FormNumberInputProps {
  label: string;
  value: number | null;
  onChangeValue: (value: number | null) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  showSteppers?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  unit?: string;
  style?: any;
  helperText?: string;
  testID?: string;
}

export const FormNumberInput: React.FC<FormNumberInputProps> = ({
  label,
  value,
  onChangeValue,
  placeholder,
  error,
  required = false,
  disabled = false,
  min,
  max,
  step = 1,
  showSteppers = false,
  allowDecimals = false,
  decimalPlaces = 2,
  unit,
  style,
  helperText,
  testID,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [textValue, setTextValue] = useState(value?.toString() || '');

  const displayLabel = required ? `${label} *` : label;
  const hasError = !!error;

  const validateAndSetValue = (text: string) => {
    setTextValue(text);
    
    if (text === '') {
      onChangeValue(null);
      return;
    }

    // Remove any non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.-]/g, '');
    
    if (cleanText === '' || cleanText === '-') {
      return;
    }

    const numValue = parseFloat(cleanText);
    
    if (isNaN(numValue)) {
      return;
    }

    // Apply min/max constraints
    let constrainedValue = numValue;
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max;
    }

    // Handle decimal places
    if (!allowDecimals) {
      constrainedValue = Math.round(constrainedValue);
    } else if (decimalPlaces !== undefined) {
      constrainedValue = parseFloat(constrainedValue.toFixed(decimalPlaces));
    }

    onChangeValue(constrainedValue);
  };

  const handleIncrement = () => {
    const currentValue = value || 0;
    const newValue = currentValue + step;
    
    if (max === undefined || newValue <= max) {
      onChangeValue(newValue);
      setTextValue(newValue.toString());
    }
  };

  const handleDecrement = () => {
    const currentValue = value || 0;
    const newValue = currentValue - step;
    
    if (min === undefined || newValue >= min) {
      onChangeValue(newValue);
      setTextValue(newValue.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setTextValue(value?.toString() || '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Update display value to match the actual value
    setTextValue(value?.toString() || '');
  };

  const canDecrement = min === undefined || (value || 0) > min;
  const canIncrement = max === undefined || (value || 0) < max;

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={displayLabel}
        value={isFocused ? textValue : (value?.toString() || '')}
        onChangeText={validateAndSetValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        mode="outlined"
        error={hasError}
        disabled={disabled}
        keyboardType={allowDecimals ? 'decimal-pad' : 'numeric'}
        style={[
          styles.input,
          showSteppers && styles.inputWithSteppers,
        ]}
        contentStyle={styles.inputContent}
        right={
          showSteppers ? (
            <View style={styles.stepperContainer}>
              <IconButton
                icon={() => <Minus size={16} />}
                size={20}
                onPress={handleDecrement}
                disabled={disabled || !canDecrement}
                style={styles.stepperButton}
              />
              <IconButton
                icon={() => <Plus size={16} />}
                size={20}
                onPress={handleIncrement}
                disabled={disabled || !canIncrement}
                style={styles.stepperButton}
              />
            </View>
          ) : unit ? (
            <TextInput.Affix text={unit} />
          ) : undefined
        }
        testID={testID}
      />

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
  input: {
    backgroundColor: 'transparent',
  },
  inputWithSteppers: {
    paddingRight: 80,
  },
  inputContent: {
    fontSize: 16,
  },
  stepperContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  stepperButton: {
    margin: 0,
    width: 32,
    height: 24,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
});