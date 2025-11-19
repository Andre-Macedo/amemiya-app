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
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color'; // Hook correto
import { Fonts } from '@/constants/theme'; // Fontes corretas

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const { login, isLoginLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Cores do Tema (Dark/Light automático)
    const primary = useThemeColor({}, 'primary');
    const background = useThemeColor({}, 'background');
    const text = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const inputBg = useThemeColor({}, 'secondary'); // Cinza claro/escuro para inputs
    const white = useThemeColor({}, 'white');

    const handleLogin = () => {
        if (email && password && !isLoginLoading) {
            login(email, password);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Cabeçalho / Logo */}
                <View style={styles.header}>
                    <View style={[styles.logoCircle, { backgroundColor: primary + '15' }]}>
                        {/* '15' adiciona transparência ao Hex */}
                        <Ionicons name="analytics" size={64} color={primary} />
                    </View>
                    <Text style={[styles.title, { color: text }]}>Metrologia</Text>
                    <Text style={[styles.subtitle, { color: textSecondary }]}>
                        Lean Tech System
                    </Text>
                </View>

                {/* Formulário */}
                <View style={styles.form}>
                    {/* Input E-mail */}
                    <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                        <Ionicons name="mail-outline" size={20} color={textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: text }]}
                            placeholder="E-mail corporativo"
                            placeholderTextColor={textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Input Senha */}
                    <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: text }]}
                            placeholder="Sua senha"
                            placeholderTextColor={textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Botão Entrar */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: primary }]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={isLoginLoading}
                    >
                        {isLoginLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={[styles.buttonText, { color: '#FFF' }]}>Acessar Sistema</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={[styles.forgotText, { color: textSecondary }]}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontFamily: Fonts.sansBold,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.sans,
        letterSpacing: 1,
    },
    form: {
        width: '100%',
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontFamily: Fonts.sans,
        fontSize: 16,
        height: '100%',
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontFamily: Fonts.sansBold,
    },
    forgotButton: {
        alignItems: 'center',
        marginTop: 16,
        padding: 8,
    },
    forgotText: {
        fontSize: 14,
        fontFamily: Fonts.sans,
    },
});