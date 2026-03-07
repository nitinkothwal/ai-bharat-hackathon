import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';

// Custom color palette for healthcare app
const healthcareColors = {
  // Primary colors - Professional teal/green for healthcare
  primary: '#006B5E',
  primaryContainer: '#7FF7E8',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#002019',
  
  // Secondary colors - Complementary blue-green
  secondary: '#4D635D',
  secondaryContainer: '#CFE9DF',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#0A1F1A',
  
  // Tertiary colors - Accent blue
  tertiary: '#3F6374',
  tertiaryContainer: '#C3E8FB',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#001E2B',
  
  // Error colors - Medical red
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',
  
  // Warning colors
  warning: '#FF8F00',
  warningContainer: '#FFECB3',
  onWarning: '#FFFFFF',
  onWarningContainer: '#2E1800',
  
  // Success colors
  success: '#2E7D32',
  successContainer: '#C8E6C9',
  onSuccess: '#FFFFFF',
  onSuccessContainer: '#0D2818',
  
  // Background and surface colors
  background: '#F8FAF9',
  onBackground: '#191C1B',
  surface: '#FFFFFF',
  onSurface: '#191C1B',
  surfaceVariant: '#DBE5E0',
  onSurfaceVariant: '#3F4945',
  
  // Outline colors
  outline: '#6F7975',
  outlineVariant: '#BFC9C4',
  
  // Other colors
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2E312F',
  inverseOnSurface: '#EFF1EF',
  inversePrimary: '#63DBD0',
  
  // Custom healthcare-specific colors
  highRisk: '#D32F2F',
  mediumRisk: '#F57C00',
  lowRisk: '#388E3C',
  neutral: '#757575',
  
  // Status colors
  pending: '#FF9800',
  completed: '#4CAF50',
  failed: '#F44336',
  synced: '#2196F3',
};

// Dark theme colors
const darkHealthcareColors = {
  ...healthcareColors,
  primary: '#63DBD0',
  onPrimary: '#003731',
  primaryContainer: '#004B44',
  onPrimaryContainer: '#7FF7E8',
  
  secondary: '#B3CCC3',
  onSecondary: '#1E352F',
  secondaryContainer: '#354B45',
  onSecondaryContainer: '#CFE9DF',
  
  tertiary: '#A7CCE8',
  onTertiary: '#0C3445',
  tertiaryContainer: '#264A5C',
  onTertiaryContainer: '#C3E8FB',
  
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  
  background: '#0F1411',
  onBackground: '#DFE4DF',
  surface: '#0F1411',
  onSurface: '#DFE4DF',
  surfaceVariant: '#3F4945',
  onSurfaceVariant: '#BFC9C4',
  
  outline: '#899490',
  outlineVariant: '#3F4945',
  
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#DFE4DF',
  inverseOnSurface: '#2E312F',
  inversePrimary: '#006B5E',
};

// Typography configuration
const fontConfig = {
  web: {
    regular: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: '100' as const,
    },
  },
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...healthcareColors,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
  animation: {
    scale: 1.0,
  },
  // Custom theme properties
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  elevation: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  accessibility: {
    minTouchTarget: 44,
    focusRingWidth: 2,
    highContrast: false,
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkHealthcareColors,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
  animation: {
    scale: 1.0,
  },
  // Custom theme properties
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  elevation: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  accessibility: {
    minTouchTarget: 44,
    focusRingWidth: 2,
    highContrast: false,
  },
};

// High contrast themes for accessibility
export const lightHighContrastTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#000000',
    onPrimary: '#FFFFFF',
    secondary: '#000000',
    onSecondary: '#FFFFFF',
    outline: '#000000',
    outlineVariant: '#000000',
  },
  accessibility: {
    ...lightTheme.accessibility,
    highContrast: true,
  },
};

export const darkHighContrastTheme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    primary: '#FFFFFF',
    onPrimary: '#000000',
    secondary: '#FFFFFF',
    onSecondary: '#000000',
    outline: '#FFFFFF',
    outlineVariant: '#FFFFFF',
  },
  accessibility: {
    ...darkTheme.accessibility,
    highContrast: true,
  },
};

// Theme utilities
export const getTheme = (
  mode: 'light' | 'dark' = 'light',
  highContrast: boolean = false
) => {
  if (mode === 'dark') {
    return highContrast ? darkHighContrastTheme : darkTheme;
  }
  return highContrast ? lightHighContrastTheme : lightTheme;
};

// Risk level color utilities
export const getRiskColor = (riskLevel: 'low' | 'medium' | 'high', theme: any) => {
  switch (riskLevel) {
    case 'high':
      return theme.colors.highRisk;
    case 'medium':
      return theme.colors.mediumRisk;
    case 'low':
      return theme.colors.lowRisk;
    default:
      return theme.colors.neutral;
  }
};

// Status color utilities
export const getStatusColor = (status: string, theme: any) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'synced':
      return theme.colors.success;
    case 'pending':
    case 'in_progress':
      return theme.colors.warning;
    case 'failed':
    case 'error':
      return theme.colors.error;
    case 'cancelled':
    case 'disabled':
      return theme.colors.neutral;
    default:
      return theme.colors.primary;
  }
};

// Responsive utilities
export const getResponsiveValue = (
  small: any,
  medium?: any,
  large?: any
) => {
  // Simple responsive implementation
  // In a real app, you'd use screen dimensions
  return small; // Default to small for now
};

// Default export (light theme for backward compatibility)
export default lightTheme;
