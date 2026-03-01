import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export default function GlassCard({ children, style, intensity = 0.5 }: GlassCardProps) {
    const theme = useTheme();

    return (
        <Surface
            elevation={2}
            style={[
                styles.card,
                {
                    backgroundColor: `rgba(255, 255, 255, ${intensity})`,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                style
            ]}
        >
            {children}
        </Surface>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 16,
    },
});
