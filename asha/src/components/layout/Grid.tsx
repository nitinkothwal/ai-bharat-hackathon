import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 2,
  spacing = 'md',
  style,
}) => {
  const theme = useTheme() as any;

  const getSpacingValue = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'sm': return theme.spacing?.sm || 8;
      case 'md': return theme.spacing?.md || 16;
      case 'lg': return theme.spacing?.lg || 24;
      default: return theme.spacing?.md || 16;
    }
  };

  const spacingValue = getSpacingValue(spacing);

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacingValue / 2,
  };

  const itemStyle: ViewStyle = {
    width: `${100 / columns}%`,
    paddingHorizontal: spacingValue / 2,
    marginBottom: spacingValue,
  };

  return (
    <View style={[gridStyle, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={itemStyle}>
          {child}
        </View>
      ))}
    </View>
  );
};

interface RowProps {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: ViewStyle;
}

export const Row: React.FC<RowProps> = ({
  children,
  spacing = 'md',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style,
}) => {
  const theme = useTheme() as any;

  const getSpacingValue = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'sm': return theme.spacing?.sm || 8;
      case 'md': return theme.spacing?.md || 16;
      case 'lg': return theme.spacing?.lg || 24;
      default: return theme.spacing?.md || 16;
    }
  };

  const spacingValue = getSpacingValue(spacing);

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: align,
    justifyContent: justify,
    ...(wrap && { flexWrap: 'wrap' }),
  };

  return (
    <View style={[rowStyle, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ marginRight: index < React.Children.count(children) - 1 ? spacingValue : 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
};

interface ColumnProps {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  style?: ViewStyle;
}

export const Column: React.FC<ColumnProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  justify = 'flex-start',
  style,
}) => {
  const theme = useTheme() as any;

  const getSpacingValue = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'sm': return theme.spacing?.sm || 8;
      case 'md': return theme.spacing?.md || 16;
      case 'lg': return theme.spacing?.lg || 24;
      default: return theme.spacing?.md || 16;
    }
  };

  const spacingValue = getSpacingValue(spacing);

  const columnStyle: ViewStyle = {
    flexDirection: 'column',
    alignItems: align,
    justifyContent: justify,
  };

  return (
    <View style={[columnStyle, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ marginBottom: index < React.Children.count(children) - 1 ? spacingValue : 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
};