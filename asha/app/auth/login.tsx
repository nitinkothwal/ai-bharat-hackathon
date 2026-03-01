import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/api';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const theme = useTheme();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authService.login(email, password);
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                        <LogIn color="white" size={32} />
                    </View>
                    <Text variant="headlineMedium" style={styles.title}>
                        Bharat CareLink
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        ASHA Worker Portal
                    </Text>
                </View>

                <Surface style={styles.form} elevation={1}>
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                    />

                    {error ? (
                        <Text style={[styles.error, { color: theme.colors.error }]}>
                            {error}
                        </Text>
                    ) : null}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        Login
                    </Button>
                </Surface>

                <Text variant="bodySmall" style={styles.footer}>
                    Ensuring health for every village, every home.
                </Text>
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
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        color: '#006B5E',
    },
    subtitle: {
        opacity: 0.7,
    },
    form: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: 'white',
    },
    input: {
        marginBottom: 16,
    },
    error: {
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        marginTop: 8,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    footer: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
});
