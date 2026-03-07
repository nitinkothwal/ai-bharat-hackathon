import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, Checkbox, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../src/store/hooks';
import { createPatient } from '../../../src/store/slices/patientsSlice';
import { createReferral } from '../../../src/store/slices/referralsSlice';
import VoiceTextInput from '../../../src/components/VoiceTextInput';
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
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    // Step state
    const [step, setStep] = useState(1);

    // Basic Info
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('female');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [aadhaar, setAadhaar] = useState('');

    // Clinical Details
    const [clinicalData, setClinicalData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    
    // Validation errors
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [apiError, setApiError] = useState<string>('');

    // Generate unique patient ID
    const generatePatientId = () => {
        const ashaCode = 'ASH001'; // TODO: Get from user context
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${ashaCode}-${date}-${sequence}`;
    };

    const getTypeName = () => {
        switch (type) {
            case 'pregnancy': return t('referral.pregnancy');
            case 'malnutrition': return t('referral.malnutrition');
            case 'tb_suspect': return t('referral.tb_suspect');
            case 'chronic_disease': return t('referral.chronic_disease');
            default: return t('patient.register');
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        // Name validation
        if (!name.trim()) {
            newErrors.name = 'Name is required';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (name.trim().length > 100) {
            newErrors.name = 'Name must not exceed 100 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            newErrors.name = 'Name should only contain letters and spaces';
        }
        
        // Age validation
        if (!age) {
            newErrors.age = 'Age is required';
        } else {
            const ageNum = parseInt(age);
            if (isNaN(ageNum)) {
                newErrors.age = 'Age must be a number';
            } else if (ageNum < 0) {
                newErrors.age = 'Age cannot be negative';
            } else if (ageNum > 120) {
                newErrors.age = 'Age must be less than 120';
            }
        }
        
        // Phone validation (optional but must be valid if provided)
        if (phone && phone.trim()) {
            if (!/^[6-9]\d{9}$/.test(phone)) {
                newErrors.phone = 'Mobile number must be 10 digits starting with 6-9';
            }
        }
        
        // Aadhaar validation (optional but must be valid if provided)
        if (aadhaar && aadhaar.trim()) {
            if (!/^\d{12}$/.test(aadhaar)) {
                newErrors.aadhaar = 'Aadhaar must be exactly 12 digits';
            }
        }
        
        // Address validation
        if (address && address.trim().length > 200) {
            newErrors.address = 'Address must not exceed 200 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        setApiError(''); // Clear any previous API errors
        if (!validateForm()) {
            return;
        }
        if (type === 'general') {
            handleSave();
        } else {
            setStep(2);
        }
    };

    const handleSave = async () => {
        setApiError(''); // Clear any previous API errors
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Create patient data matching API expectations
            const patientData = {
                aadhaar_number: aadhaar || '000000000000', // Use dummy if not provided
                full_name: name.trim(),
                age: parseInt(age),
                gender: gender as 'male' | 'female' | 'other',
                mobile_number: phone || '',
                village_code: 'VIL001', // TODO: Get from user context
                village_name: 'Default Village', // TODO: Get from user context
                address: address.trim() || '',
            };

            // 1. Create Patient
            const result = await dispatch(createPatient(patientData));
            
            if (createPatient.fulfilled.match(result)) {
                const patient = result.payload;

                // 2. Create Referral if not general
                if (type !== 'general' && patient) {
                    // Map clinical data to symptoms and vital signs
                    const symptoms: string[] = [];
                    const vital_signs: any = {};
                    
                    // Extract symptoms based on type
                    if (type === 'tb_suspect') {
                        if (clinicalData.cough_long) symptoms.push('Cough > 2 weeks');
                        if (clinicalData.night_fever) symptoms.push('Fever at night');
                        if (clinicalData.weight_loss) symptoms.push('Weight Loss');
                    } else if (type === 'pregnancy') {
                        if (clinicalData.prev_csection) symptoms.push('Previous C-Section');
                        if (clinicalData.severe_anemia) symptoms.push('Severe Anemia');
                        if (clinicalData.bp) {
                            const [systolic, diastolic] = clinicalData.bp.split('/').map(Number);
                            vital_signs.blood_pressure_systolic = systolic;
                            vital_signs.blood_pressure_diastolic = diastolic;
                        }
                    } else if (type === 'malnutrition') {
                        symptoms.push('Malnutrition assessment');
                    } else if (type === 'chronic_disease') {
                        symptoms.push('Chronic disease monitoring');
                        if (clinicalData.bp) {
                            const [systolic, diastolic] = clinicalData.bp.split('/').map(Number);
                            vital_signs.blood_pressure_systolic = systolic;
                            vital_signs.blood_pressure_diastolic = diastolic;
                        }
                    }
                    
                    // Default to at least one symptom
                    if (symptoms.length === 0) {
                        symptoms.push('General health concern');
                    }
                    
                    const referralResult = await dispatch(createReferral({
                        patient_id: patient.id || patient.patient_id,
                        symptoms,
                        vital_signs: Object.keys(vital_signs).length > 0 ? vital_signs : undefined,
                        urgency_level: 'medium', // Default urgency
                        notes: JSON.stringify(clinicalData), // Store full clinical data in notes
                    }));
                    
                    if (createReferral.rejected.match(referralResult)) {
                        // Patient created but referral failed
                        const errorMsg = referralResult.payload as string || 'Failed to create referral';
                        setApiError(`Patient created successfully, but referral creation failed: ${errorMsg}`);
                        Alert.alert(
                            'Partial Success',
                            'Patient was created but referral creation failed. You can create the referral later.',
                            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                        );
                        return;
                    }
                }

                Alert.alert(t('common.success'), t('patient.patient_saved'), [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            } else {
                // Extract error message from rejected action
                const errorMsg = result.payload as string || 'Failed to create patient';
                setApiError(errorMsg);
                
                // Show user-friendly error messages
                if (errorMsg.includes('already exists') || errorMsg.includes('409')) {
                    Alert.alert('Duplicate Patient', 'A patient with this Aadhaar number already exists.');
                } else if (errorMsg.includes('403') || errorMsg.includes('Access denied')) {
                    Alert.alert('Access Denied', 'You do not have permission to create patients.');
                } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    Alert.alert('Session Expired', 'Please log in again.');
                } else {
                    Alert.alert('Error', `Failed to create patient: ${errorMsg}`);
                }
            }
        } catch (error: any) {
            console.error('Registration failed', error);
            const errorMsg = error?.message || 'An unexpected error occurred';
            setApiError(errorMsg);
            Alert.alert(t('common.error'), errorMsg);
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
                label={t('patient.gender')}
                options={[
                    { label: t('patient.female'), value: 'female', icon: User },
                    { label: t('patient.male'), value: 'male', icon: UserCheck },
                ]}
                value={gender}
                onSelect={setGender}
            />

            <VoiceTextInput
                label={t('patient.name')}
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                        setErrors({...errors, name: ''});
                    }
                }}
                mode="outlined"
                fieldName="patient_name"
                left={<TextInput.Icon icon={() => <User size={20} color={theme.colors.primary} />} />}
                style={styles.input}
                error={!!errors.name}
            />
            {errors.name && <HelperText type="error" visible={true}>{errors.name}</HelperText>}

            <VoiceTextInput
                label={t('patient.age')}
                value={age}
                onChangeText={(text) => {
                    setAge(text);
                    if (errors.age) {
                        setErrors({...errors, age: ''});
                    }
                }}
                mode="outlined"
                keyboardType="numeric"
                fieldName="patient_age"
                left={<TextInput.Icon icon={() => <Calendar size={20} color={theme.colors.primary} />} />}
                style={styles.input}
                error={!!errors.age}
            />
            {errors.age && <HelperText type="error" visible={true}>{errors.age}</HelperText>}

            <VoiceTextInput
                label={t('patient.mobile')}
                value={phone}
                onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) {
                        setErrors({...errors, phone: ''});
                    }
                }}
                mode="outlined"
                keyboardType="phone-pad"
                fieldName="patient_phone"
                left={<TextInput.Icon icon={() => <Smartphone size={20} color={theme.colors.primary} />} />}
                style={styles.input}
                error={!!errors.phone}
            />
            {errors.phone && <HelperText type="error" visible={true}>{errors.phone}</HelperText>}

            <VoiceTextInput
                label={t('patient.address')}
                value={address}
                onChangeText={(text) => {
                    setAddress(text);
                    if (errors.address) {
                        setErrors({...errors, address: ''});
                    }
                }}
                mode="outlined"
                multiline
                numberOfLines={3}
                fieldName="patient_address"
                left={<TextInput.Icon icon={() => <Home size={20} color={theme.colors.primary} />} />}
                style={styles.input}
                error={!!errors.address}
            />
            {errors.address && <HelperText type="error" visible={true}>{errors.address}</HelperText>}

            <VoiceTextInput
                label={t('patient.aadhaar')}
                value={aadhaar}
                onChangeText={(text) => {
                    setAadhaar(text);
                    if (errors.aadhaar) {
                        setErrors({...errors, aadhaar: ''});
                    }
                }}
                mode="outlined"
                keyboardType="numeric"
                fieldName="patient_aadhaar"
                maxLength={12}
                style={styles.input}
                secureTextEntry
                error={!!errors.aadhaar}
            />
            {errors.aadhaar && <HelperText type="error" visible={true}>{errors.aadhaar}</HelperText>}
            <HelperText type="info">
                {t('patient.aadhaar_helper')}
            </HelperText>

            {apiError && (
                <Surface style={styles.errorBox}>
                    <Text style={styles.errorText}>{apiError}</Text>
                </Surface>
            )}

            <Button
                mode="contained"
                onPress={handleNext}
                style={styles.button}
                contentStyle={{ height: 50 }}
                disabled={loading}
            >
                {type === 'general' ? t('patient.save') : t('common.next')}
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
                        {step === 1 ? t('patient.step1_info') : t('patient.step2_clinical')}
                    </Text>
                </View>

                <GlassCard style={styles.formCard} intensity={0.9}>
                    {step === 1 ? renderStep1() : (
                        <View>
                            {renderClinicalFields()}
                            
                            {apiError && (
                                <Surface style={styles.errorBox}>
                                    <Text style={styles.errorText}>{apiError}</Text>
                                </Surface>
                            )}
                            
                            <View style={styles.buttonRow}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setStep(1)}
                                    style={[styles.button, { flex: 1, marginRight: 8 }]}
                                    disabled={loading}
                                >
                                    {t('common.back')}
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleSave}
                                    loading={loading}
                                    disabled={loading}
                                    style={[styles.button, { flex: 2 }]}
                                >
                                    {t('common.done')}
                                </Button>
                            </View>
                        </View>
                    )}
                </GlassCard>

                <View style={styles.infoBox}>
                    <Info size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={styles.infoText}>
                        {t('patient.sync_info')}
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
