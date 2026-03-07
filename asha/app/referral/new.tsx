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
    
    // Validation errors
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [apiError, setApiError] = useState<string>('');

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

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        // Symptoms validation
        if (!symptoms.trim()) {
            newErrors.symptoms = 'Symptoms are required';
        } else if (symptoms.trim().length < 10) {
            newErrors.symptoms = 'Please provide more detailed symptoms (at least 10 characters)';
        }
        
        // Blood pressure validation (optional but must be valid if provided)
        if (bp && bp.trim()) {
            const bpPattern = /^\d{2,3}\/\d{2,3}$/;
            if (!bpPattern.test(bp)) {
                newErrors.bp = 'Blood pressure must be in format: 120/80';
            } else {
                const [systolic, diastolic] = bp.split('/').map(Number);
                if (systolic < 70 || systolic > 250) {
                    newErrors.bp = 'Systolic pressure must be between 70-250';
                } else if (diastolic < 40 || diastolic > 150) {
                    newErrors.bp = 'Diastolic pressure must be between 40-150';
                } else if (systolic <= diastolic) {
                    newErrors.bp = 'Systolic must be greater than diastolic';
                }
            }
        }
        
        // Hemoglobin validation (optional but must be valid if provided)
        if (hemoglobin && hemoglobin.trim()) {
            const hbValue = parseFloat(hemoglobin);
            if (isNaN(hbValue)) {
                newErrors.hemoglobin = 'Hemoglobin must be a number';
            } else if (hbValue < 3 || hbValue > 20) {
                newErrors.hemoglobin = 'Hemoglobin must be between 3-20 g/dL';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAssessment = () => {
        setApiError(''); // Clear any previous API errors
        
        if (!validateForm()) {
            return;
        }
        
        // Simulate AI Risk Assessment call
        const score = Math.random();
        setRiskAssessment({
            score: Math.round(score * 100),
            level: score > 0.7 ? 'HIGH' : score > 0.4 ? 'MEDIUM' : 'LOW'
        });
    };

    const handleCreateReferral = async () => {
        if (!patient) {
            setApiError('Patient information is missing');
            return;
        }
        
        setApiError(''); // Clear any previous API errors
        
        if (!validateForm()) {
            return;
        }
        
        if (!riskAssessment) {
            setApiError('Please run risk assessment before submitting');
            return;
        }

        setLoading(true);
        try {
            // Prepare symptoms array
            const symptomsArray = symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            // Prepare vital signs
            const vital_signs: any = {};
            if (bp) {
                const [systolic, diastolic] = bp.split('/').map(Number);
                vital_signs.blood_pressure_systolic = systolic;
                vital_signs.blood_pressure_diastolic = diastolic;
            }
            if (hemoglobin) {
                vital_signs.hemoglobin = parseFloat(hemoglobin);
            }
            
            // Determine urgency level based on risk assessment
            let urgency_level: 'low' | 'medium' | 'high' | 'critical' = 'medium';
            if (riskAssessment.level === 'HIGH') {
                urgency_level = 'high';
            } else if (riskAssessment.level === 'LOW') {
                urgency_level = 'low';
            }
            
            await referralService.create({
                patient_id: patient.id || patient.patient_id,
                symptoms: symptomsArray.length > 0 ? symptomsArray : [symptoms],
                vital_signs: Object.keys(vital_signs).length > 0 ? vital_signs : undefined,
                urgency_level,
                notes: `Referral Type: ${referralType}. Risk Score: ${riskAssessment.score}%`,
            });
            
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Failed to create referral', error);
            const errorMsg = error?.message || 'Failed to create referral';
            setApiError(errorMsg);
            
            // Show user-friendly error messages
            if (errorMsg.includes('404') || errorMsg.includes('not found')) {
                setApiError('Patient not found. Please try again.');
            } else if (errorMsg.includes('403') || errorMsg.includes('Access denied')) {
                setApiError('You do not have permission to create referrals.');
            } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                setApiError('Session expired. Please log in again.');
            } else {
                setApiError(`Error: ${errorMsg}`);
            }
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
                        onChangeText={(text) => {
                            setSymptoms(text);
                            if (errors.symptoms) {
                                setErrors({...errors, symptoms: ''});
                            }
                        }}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                        placeholder="Describe the patient's condition..."
                        error={!!errors.symptoms}
                    />
                    {errors.symptoms && <HelperText type="error" visible={true}>{errors.symptoms}</HelperText>}

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <TextInput
                                label="Blood Pressure"
                                value={bp}
                                onChangeText={(text) => {
                                    setBp(text);
                                    if (errors.bp) {
                                        setErrors({...errors, bp: ''});
                                    }
                                }}
                                mode="outlined"
                                style={styles.input}
                                placeholder="e.g. 120/80"
                                error={!!errors.bp}
                            />
                            {errors.bp && <HelperText type="error" visible={true}>{errors.bp}</HelperText>}
                        </View>
                        <View style={{ flex: 1 }}>
                            <TextInput
                                label="Hemoglobin (g/dL)"
                                value={hemoglobin}
                                onChangeText={(text) => {
                                    setHemoglobin(text);
                                    if (errors.hemoglobin) {
                                        setErrors({...errors, hemoglobin: ''});
                                    }
                                }}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                placeholder="e.g. 11.5"
                                error={!!errors.hemoglobin}
                            />
                            {errors.hemoglobin && <HelperText type="error" visible={true}>{errors.hemoglobin}</HelperText>}
                        </View>
                    </View>

                    {!riskAssessment ? (
                        <Button
                            mode="outlined"
                            icon={() => <Brain size={18} color={theme.colors.primary} />}
                            onPress={handleAssessment}
                            style={styles.assessmentButton}
                            disabled={loading}
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
                    
                    {apiError && (
                        <Surface style={styles.errorBox}>
                            <Text style={styles.errorText}>{apiError}</Text>
                        </Surface>
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
    errorBox: {
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#D32F2F',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 14,
    },
});
