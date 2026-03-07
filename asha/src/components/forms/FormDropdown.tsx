import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text, HelperText, useTheme } from 'react-native-paper';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FormDropdownProps {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
  helperText?: string;
  testID?: string;
}

export const FormDropdown: React.FC<FormDropdownProps> = ({
  label,
  value,
  onSelect,
  options,
  placeholder,
  error,
  required = false,
  disabled = false,
  style,
  helperText,
  testID,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const displayLabel = required ? `${label} *` : label;
  const hasError = !!error;
  
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || placeholder || t('common.select');

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    closeMenu();
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
      
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={disabled ? undefined : openMenu}
            disabled={disabled}
            style={[
              styles.button,
              hasError && { borderColor: theme.colors.error },
            ]}
            contentStyle={styles.buttonContent}
            labelStyle={[
              styles.buttonLabel,
              !selectedOption && styles.placeholderText,
              hasError && { color: theme.colors.error },
            ]}
            icon={({ size, color }) => (
              <ChevronDown 
                size={size} 
                color={disabled ? theme.colors.outline : color} 
              />
            )}
            testID={testID}
          >
            {displayValue}
          </Button>
        }
        contentStyle={styles.menuContent}
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onPress={() => handleSelect(option.value)}
            title={option.label}
            disabled={option.disabled}
            style={[
              styles.menuItem,
              option.value === value && styles.selectedMenuItem,
            ]}
            titleStyle={[
              option.value === value && { 
                color: theme.colors.primary,
                fontWeight: '600'
              }
            ]}
          />
        ))}
      </Menu>

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
    justifyContent: 'space-between',
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'left',
    flex: 1,
  },
  placeholderText: {
    opacity: 0.6,
  },
  menuContent: {
    maxHeight: 300,
  },
  menuItem: {
    minHeight: 48,
  },
  selectedMenuItem: {
    backgroundColor: 'rgba(103, 80, 164, 0.08)',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
});