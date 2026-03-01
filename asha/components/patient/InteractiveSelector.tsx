import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LucideIcon } from 'lucide-react-native';
import GlassCard from '../glass/GlassCard';

interface Option {
    label: string;
    value: string;
    icon: LucideIcon;
}

interface InteractiveSelectorProps {
    options: Option[];
    value: string;
    onSelect: (value: string) => void;
    label?: string;
}

export default function InteractiveSelector({ options, value, onSelect, label }: InteractiveSelectorProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            {label && <Text variant="titleMedium" style={styles.label}>{label}</Text>}
            <View style={styles.row}>
                {options.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            style={styles.option}
                            onPress={() => onSelect(option.value)}
                        >
                            <GlassCard
                                intensity={isSelected ? 1 : 0.4}
                                style={[
                                    styles.card,
                                    isSelected && {
                                        borderColor: theme.colors.primary,
                                        backgroundColor: theme.colors.primaryContainer
                                    }
                                ]}
                            >
                                <option.icon
                                    size={24}
                                    color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                />
                                <Text
                                    variant="labelLarge"
                                    style={[
                                        styles.optionLabel,
                                        isSelected && { color: theme.colors.primary, fontWeight: 'bold' }
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </GlassCard>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        opacity: 0.8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    option: {
        flex: 1,
        marginHorizontal: 4,
    },
    card: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        marginTop: 4,
    },
});
