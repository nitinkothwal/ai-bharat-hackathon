import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, Checkbox, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    User,
    UserCheck,
    Smartphone,
    Home,
    Calendar,
    Baby,
    Activity,
    Brain,
    Info
} from 'lucide-react-native';
import { patientService, referralService } from '../../../src/services/api';
import GlassCard from '../../../components/glass/GlassCard';
import InteractiveSelector from '../../../components/patient/InteractiveSelector';

const GENDER_OPTIONS = [
    { label: 'Female', value: 'female', icon: User },
    { label: 'Male', value: 'male', icon: UserCheck },
];

export default function RegisterPatientScreen() {
    const { type } = useLocalSearchParams<{ type: string }>();
    const theme = useTheme();
    const router = useRouter();

    // Step state
    const [step, setStep] = useState(1);

    // Basic Info
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('female');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Clinical Details
    const [clinicalData, setClinicalData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const getTypeName = () => {
        switch (type) {
            case 'pregnancy': return 'Maternal Health';
            case 'malnutrition': return 'Child Health';
            case 'tb_suspect': return 'TB Suspect';
            case 'chronic_disease': return 'Chronic Illness';
            default: return 'General Patient';
        }
    };

    const handleNext = () => {
        if (!name || !age) {
            Alert.alert('Missing Info', 'Please enter Name and Age');
            return;
        }
        if (type === 'general') {
            handleSave();
        } else {
            setStep(2);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Create Patient
            const patient = await patientService.create({
                name,
                age: parseInt(age),
                gender: gender as any,
                phone,
                address,
            });

            // 2. Create Referral if not general
            if (type !== 'general' && patient) {
                await referralService.create({
                    patient_id: patient.id,
                    referral_type: type as any,
                    form_data: clinicalData,
                    status: 'submitted',
                });
            }

            Alert.alert('Success', 'Patient registered successfully');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Registration failed', error);
            Alert.alert('Error', 'Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    const updateClinicalField = (field: string, value: any) => {
        setClinicalData((prev: any) => ({ ...prev, [field]: value }));
    };

    const renderStep1 = () => (
        <View>
            <InteractiveSelector
                label="Select Gender"
                options={GENDER_OPTIONS}
                value={gender}
                onSelect={setGender}
            />

            <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                left={<TextInput.Icon icon={() => <User size={20} color={theme.colors.primary} />} />}
                style={styles.input}
            />

            <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon={() => <Calendar size={20} color={theme.colors.primary} />} />}
                style={styles.input}
            />

            <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                keyboardType="phone-pad"
                left={<TextInput.Icon icon={() => <Smartphone size={20} color={theme.colors.primary} />} />}
                style={styles.input}
            />

            <TextInput
                label="Home Address"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon={() => <Home size={20} color={theme.colors.primary} />} />}
                style={styles.input}
            />

            <Button
                mode="contained"
                onPress={handleNext}
                style={styles.button}
                contentStyle={{ height: 50 }}
            >
                {type === 'general' ? 'Register Patient' : 'Next: Clinical Details'}
            </Button>
        </View>
    );

    const renderClinicalFields = () => {
        switch (type) {
            case 'pregnancy':
                return (
                    <View>
                        <TextInput
                            label="Last Menstrual Period (LMP)"
                            placeholder="DD/MM/YYYY"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('lmp', v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Blood Pressure"
                            placeholder="e.g. 120/80"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('bp', v)}
                            style={styles.input}
                        />
                        <View style={styles.checklist}>
                            <Text variant="titleMedium">Risk Factors</Text>
                            <Checkbox.Item
                                label="Previous C-Section"
                                status={clinicalData.prev_csection ? 'checked' : 'unchecked'}
                                onPress={() => updateClinicalField('prev_csection', !clinicalData.prev_csection)}
                            />
                            <Checkbox.Item
                                label="Severe Anemia"
                                status={clinicalData.severe_anemia ? 'checked' : 'unchecked'}
                                onPress={() => updateClinicalField('severe_anemia', !clinicalData.severe_anemia)}
                            />
                        </View>
                    </View>
                );
            case 'malnutrition':
                return (
                    <View>
                        <TextInput
                            label="Weight (kg)"
                            keyboardType="numeric"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('weight', v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Height (cm)"
                            keyboardType="numeric"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('height', v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="MUAC (cm)"
                            keyboardType="numeric"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('muac', v)}
                            style={styles.input}
                        />
                        <HelperText type="info">{"MUAC < 11.5cm indicates SAM"}</HelperText>
                    </View>
                );
            case 'tb_suspect':
                return (
                    <View>
                        <Text variant="titleMedium">Symptoms Checklist</Text>
                        <Checkbox.Item
                            label="Cough > 2 weeks"
                            status={clinicalData.cough_long ? 'checked' : 'unchecked'}
                            onPress={() => updateClinicalField('cough_long', !clinicalData.cough_long)}
                        />
                        <Checkbox.Item
                            label="Fever at night"
                            status={clinicalData.night_fever ? 'checked' : 'unchecked'}
                            onPress={() => updateClinicalField('night_fever', !clinicalData.night_fever)}
                        />
                        <Checkbox.Item
                            label="Weight Loss"
                            status={clinicalData.weight_loss ? 'checked' : 'unchecked'}
                            onPress={() => updateClinicalField('weight_loss', !clinicalData.weight_loss)}
                        />
                    </View>
                );
            case 'chronic_disease':
                return (
                    <View>
                        <TextInput
                            label="Fasting Blood Sugar"
                            keyboardType="numeric"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('fbs', v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Blood Pressure"
                            placeholder="e.g. 140/90"
                            mode="outlined"
                            onChangeText={v => updateClinicalField('bp', v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Current Medications"
                            mode="outlined"
                            multiline
                            onChangeText={v => updateClinicalField('meds', v)}
                            style={styles.input}
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={styles.title}>{getTypeName()}</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {step === 1 ? 'Step 1: Patient Information' : 'Step 2: Clinical Details'}
                    </Text>
                </View>

                <GlassCard style={styles.formCard} intensity={0.9}>
                    {step === 1 ? renderStep1() : (
                        <View>
                            {renderClinicalFields()}
                            <View style={styles.buttonRow}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setStep(1)}
                                    style={[styles.button, { flex: 1, marginRight: 8 }]}
                                >
                                    Back
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleSave}
                                    loading={loading}
                                    style={[styles.button, { flex: 2 }]}
                                >
                                    Complete
                                </Button>
                            </View>
                        </View>
                    )}
                </GlassCard>

                <View style={styles.infoBox}>
                    <Info size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={styles.infoText}>
                        Data will be securely synced with the PHC dashboard.
                    </Text>
                </View>
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
    subtitle: {
        opacity: 0.7,
    },
    formCard: {
        padding: 20,
        borderRadius: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 16,
    },
    checklist: {
        marginTop: 8,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        padding: 12,
        backgroundColor: 'rgba(0, 107, 94, 0.05)',
        borderRadius: 8,
    },
    infoText: {
        marginLeft: 8,
        opacity: 0.8,
    },
});
