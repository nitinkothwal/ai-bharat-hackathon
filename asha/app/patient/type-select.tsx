import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
    Baby,
    UserPlus,
    Stethoscope,
    Activity,
    HeartPulse,
    ChevronRight,
    LucideIcon
} from 'lucide-react-native';
import GlassCard from '../../components/glass/GlassCard';

interface TypeOption {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

const REGISTRATION_TYPES: TypeOption[] = [
    {
        id: 'pregnancy',
        title: 'Maternal Health',
        description: 'Pregnant women with complications',
        icon: UserPlus, // Using UserPlus as a placeholder for pregnant, can change if better icon found
        color: '#E91E63',
        bgColor: 'rgba(252, 228, 236, 0.8)',
    },
    {
        id: 'malnutrition',
        title: 'Child Health',
        description: 'Malnourished children (SAM/MAM)',
        icon: Baby,
        color: '#4CAF50',
        bgColor: 'rgba(232, 245, 233, 0.8)',
    },
    {
        id: 'tb_suspect',
        title: 'TB Suspect',
        description: 'Patients with tuberculosis symptoms',
        icon: Activity,
        color: '#FF9800',
        bgColor: 'rgba(255, 243, 224, 0.8)',
    },
    {
        id: 'chronic_disease',
        title: 'Chronic Illness',
        description: 'Diabetes, Hypertension, etc.',
        icon: HeartPulse,
        color: '#F44336',
        bgColor: 'rgba(255, 235, 238, 0.8)',
    },
    {
        id: 'general',
        title: 'General Patient',
        description: 'Regular health checkup or other issues',
        icon: Stethoscope,
        color: '#006B5E',
        bgColor: 'rgba(224, 242, 241, 0.8)',
    },
];

export default function PatientTypeSelectScreen() {
    const theme = useTheme();
    const router = useRouter();

    const handleSelect = (typeId: string) => {
        router.push({
            pathname: '/patient/register',
            params: { type: typeId }
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.title}>Register New Patient</Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Select the category to provide specific clinical details
                </Text>
            </View>

            <View style={styles.grid}>
                {REGISTRATION_TYPES.filter(t => t.id !== 'general').map((type) => (
                    <Pressable
                        key={type.id}
                        style={styles.gridItem}
                        onPress={() => handleSelect(type.id)}
                    >
                        <GlassCard
                            style={[styles.card, { backgroundColor: type.bgColor }]}
                            intensity={0.9}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: type.color + '20' }]}>
                                <type.icon size={32} color={type.color} />
                            </View>
                            <Text variant="titleMedium" style={[styles.cardTitle, { color: type.color }]}>
                                {type.title}
                            </Text>
                            <Text variant="bodySmall" style={styles.cardDesc}>
                                {type.description}
                            </Text>
                        </GlassCard>
                    </Pressable>
                ))}
            </View>

            {REGISTRATION_TYPES.filter(t => t.id === 'general').map((type) => (
                <Pressable
                    key={type.id}
                    style={styles.fullWidthItem}
                    onPress={() => handleSelect(type.id)}
                >
                    <GlassCard
                        style={[styles.fullWidthCard, { backgroundColor: type.bgColor }]}
                        intensity={0.9}
                    >
                        <View style={styles.fullWidthContent}>
                            <View style={[styles.iconContainer, { backgroundColor: type.color + '20', marginRight: 16 }]}>
                                <type.icon size={32} color={type.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium" style={[styles.cardTitle, { color: type.color }]}>
                                    {type.title}
                                </Text>
                                <Text variant="bodySmall" style={styles.cardDesc}>
                                    {type.description}
                                </Text>
                            </View>
                            <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
                        </View>
                    </GlassCard>
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAF9',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontWeight: 'bold',
        color: '#006B5E',
        marginBottom: 4,
    },
    subtitle: {
        opacity: 0.7,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        marginBottom: 16,
    },
    card: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardDesc: {
        textAlign: 'center',
        opacity: 0.8,
        fontSize: 11,
    },
    fullWidthItem: {
        width: '100%',
        marginTop: 8,
    },
    fullWidthCard: {
        padding: 16,
    },
    fullWidthContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
