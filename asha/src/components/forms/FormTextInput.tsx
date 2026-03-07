import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface FormTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  secureTextEntry?: boolean;
  left?: React.ComponentProps<typeof TextInput>['left'];
  right?: React.ComponentProps<typeof TextInput>['right'];
  mode?: 'flat' | 'outlined';
  style?: any;
  helperText?: string;
  testID?: string;
}

export const FormTextInput: React.FC<FormTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  maxLength,
  secureTextEntry = false,
  left,
  right,
  mode = 'outlined',
  style,
  helperText,
  testID,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const displayLabel = required ? `${label} *` : label;
  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={displayLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        mode={mode}
        error={hasError}
        disabled={disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        left={left}
        right={right}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          hasError && styles.inputError,
          isFocused && styles.inputFocused,
        ]}
        contentStyle={styles.inputContent}
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
  inputContent: {
    fontSize: 16,
  },
  inputError: {
    // Error styling handled by Paper's error prop
  },
  inputFocused: {
    // Focus styling handled by Paper
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
});