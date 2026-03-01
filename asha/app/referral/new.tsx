import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, SegmentedButtons, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { referralService, patientService } from '../../src/services/api';
import { Patient, Referral } from '../../src/types';
import GlassCard from '../../components/glass/GlassCard';
import { Activity, Brain, ShieldAlert } from 'lucide-react-native';

export default function NewReferralScreen() {
    const { patientId } = useLocalSearchParams();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [referralType, setReferralType] = useState('pregnancy');
    const [symptoms, setSymptoms] = useState('');
    const [bp, setBp] = useState('');
    const [hemoglobin, setHemoglobin] = useState('');
    const [loading, setLoading] = useState(false);
    const [riskAssessment, setRiskAssessment] = useState<{ score: number, level: string } | null>(null);

    const theme = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (patientId) {
            patientService.getAll().then(patients => {
                const found = patients.find(p => p.id === patientId);
                if (found) setPatient(found);
            });
        }
    }, [patientId]);

    const handleAssessment = () => {
        // Simulate AI Risk Assessment call
        const score = Math.random();
        setRiskAssessment({
            score: Math.round(score * 100),
            level: score > 0.7 ? 'HIGH' : score > 0.4 ? 'MEDIUM' : 'LOW'
        });
    };

    const handleCreateReferral = async () => {
        if (!patient) return;

        setLoading(true);
        try {
            await referralService.create({
                patient_id: patient.id,
                referral_type: referralType as any,
                form_data: { symptoms, bp, hemoglobin },
                risk_score: riskAssessment?.score,
                risk_level: riskAssessment?.level.toLowerCase() as any,
            });
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Failed to create referral', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={styles.title}>Clinical Referral</Text>
                    {patient && (
                        <Text variant="titleMedium" style={styles.patientName}>For: {patient.name}</Text>
                    )}
                </View>

                <Surface style={styles.form} elevation={1}>
                    <Text variant="titleMedium" style={styles.label}>Referral Category</Text>
                    <SegmentedButtons
                        value={referralType}
                        onValueChange={setReferralType}
                        buttons={[
                            { value: 'pregnancy', label: 'Maternal' },
                            { value: 'tb_suspect', label: 'TB' },
                            { value: 'malnutrition', label: 'Nutrition' },
                        ]}
                        style={styles.segmented}
                    />

                    <TextInput
                        label="Key Symptoms"
                        value={symptoms}
                        onChangeText={setSymptoms}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                        placeholder="Describe the patient's condition..."
                    />

                    <View style={styles.row}>
                        <TextInput
                            label="Blood Pressure"
                            value={bp}
                            onChangeText={setBp}
                            mode="outlined"
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="e.g. 120/80"
                        />
                        <TextInput
                            label="Hemoglobin (g/dL)"
                            value={hemoglobin}
                            onChangeText={setHemoglobin}
                            mode="outlined"
                            keyboardType="numeric"
                            style={[styles.input, { flex: 1 }]}
                            placeholder="e.g. 11.5"
                        />
                    </View>

                    {!riskAssessment ? (
                        <Button
                            mode="outlined"
                            icon={() => <Brain size={18} color={theme.colors.primary} />}
                            onPress={handleAssessment}
                            style={styles.assessmentButton}
                        >
                            Analyze Clinical Risk
                        </Button>
                    ) : (
                        <GlassCard
                            style={StyleSheet.flatten([
                                styles.riskCard,
                                { backgroundColor: riskAssessment.level === 'HIGH' ? 'rgba(255, 235, 238, 0.9)' : 'rgba(232, 245, 233, 0.9)' }
                            ])}
                        >

                            <View style={styles.riskHeader}>
                                <ShieldAlert size={24} color={riskAssessment.level === 'HIGH' ? theme.colors.error : theme.colors.primary} />
                                <Text variant="titleLarge" style={{ marginLeft: 8, fontWeight: 'bold' }}>
                                    AI Risk: {riskAssessment.level}
                                </Text>
                            </View>
                            <Text variant="bodyMedium">Score: {riskAssessment.score}% Confidence</Text>
                            <Text variant="bodySmall" style={{ marginTop: 4 }}>
                                {riskAssessment.level === 'HIGH' ? 'Immediate referral recommended.' : 'Follow standard PHC protocol.'}
                            </Text>
                        </GlassCard>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleCreateReferral}
                        loading={loading}
                        disabled={loading || !riskAssessment}
                        style={styles.submitButton}
                    >
                        Submit Referral to PHC
                    </Button>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAF9',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        color: '#006B5E',
    },
    patientName: {
        opacity: 0.7,
    },
    form: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'white',
    },
    label: {
        marginBottom: 8,
    },
    segmented: {
        marginBottom: 20,
    },
    input: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    assessmentButton: {
        marginVertical: 10,
        borderColor: '#006B5E',
    },
    riskCard: {
        marginVertical: 16,
        padding: 16,
    },
    riskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    submitButton: {
        marginTop: 12,
        borderRadius: 8,
        paddingVertical: 4,
    },
});
