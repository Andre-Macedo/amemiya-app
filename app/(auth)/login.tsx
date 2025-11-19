import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/Colors';

export default function LoginScreen() {
    const { login, isLoginLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (email && password && !isLoginLoading) {
            login(email, password);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.loginContainer}
            >
                <View style={styles.loginContent}>
                    <Ionicons name="analytics-outline" size={80} color={COLORS.primary} />
                    <Text style={styles.loginTitle}>Metrologia</Text>
                    <Text style={styles.loginSubtitle}>Sistema de Gestão de Instrumentos</Text>

                    <View style={styles.loginForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={COLORS.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            textContentType="emailAddress"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Senha"
                            placeholderTextColor={COLORS.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            textContentType="password"
                        />

                        {isLoginLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
                        ) : (
                            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                                <Text style={styles.loginButtonText}>Entrar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    loginContent: {
        alignItems: 'center',
    },
    loginTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 8,
    },
    loginSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 40,
    },
    loginForm: {
        width: '100%',
    },
    input: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
        color: COLORS.text,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    },
    spinner: {
        marginTop: 25,
    }
});
