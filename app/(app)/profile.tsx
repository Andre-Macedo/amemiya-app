import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/Colors';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.screenContainer}>
                <Text style={styles.screenTitle}>Perfil</Text>

                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
                    </View>
                    <Text style={styles.profileName}>{user?.name}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
                    <Text style={styles.logoutButtonText}>Sair</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ... (estilos permanecem os mesmos) ...
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    screenContainer: {
        flex: 1,
        padding: 20,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    profileCard: {
        backgroundColor: COLORS.white,
        padding: 30,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        marginBottom: 30,
    },
    profileHeader: {
        marginBottom: 20,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    profileEmail: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    logoutButton: {
        backgroundColor: COLORS.danger,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
});
