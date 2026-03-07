import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface ContainerProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  scrollable?: boolean;
  centerContent?: boolean;
  safeArea?: boolean;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  padding = 'md',
  margin = 'none',
  backgroundColor,
  scrollable = false,
  centerContent = false,
  safeArea = false,
  style,
}) => {
  const theme = useTheme() as any;

  const getPaddingValue = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'sm': return theme.spacing?.sm || 8;
      case 'md': return theme.spacing?.md || 16;
      case 'lg': return theme.spacing?.lg || 24;
      case 'xl': return theme.spacing?.xl || 32;
      default: return theme.spacing?.md || 16;
    }
  };

  const getMarginValue = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'sm': return theme.spacing?.sm || 8;
      case 'md': return theme.spacing?.md || 16;
      case 'lg': return theme.spacing?.lg || 24;
      case 'xl': return theme.spacing?.xl || 32;
      default: return 0;
    }
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    padding: getPaddingValue(padding),
    margin: getMarginValue(margin),
    backgroundColor: backgroundColor || theme.colors.background,
    ...(centerContent && {
      justifyContent: 'center',
      alignItems: 'center',
    }),
    ...(safeArea && {
      paddingTop: 44, // Simple safe area implementation
    }),
  };

  if (scrollable) {
    return (
      <ScrollView
        style={[containerStyle, style]}
        contentContainerStyle={centerContent ? styles.scrollCentered : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});