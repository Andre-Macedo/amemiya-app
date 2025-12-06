import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { Stack } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import {SafeAreaView} from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    // Cores
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const danger = useThemeColor({}, 'danger');
    const border = useThemeColor({}, 'border');

    const SettingItem = ({ icon, label, value, isSwitch = false, onPress }: any) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: border }]}
            onPress={onPress}
            disabled={isSwitch}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconBox, { backgroundColor: primary + '10' }]}>
                    <Ionicons name={icon} size={20} color={primary} />
                </View>
                <Text style={[styles.settingLabel, { color: text }]}>{label}</Text>
            </View>
            {isSwitch ? (
                <Switch
                    value={value}
                    trackColor={{ false: border, true: primary }}
                    thumbColor={'#FFF'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={textSec} />
            )}
        </TouchableOpacity>
    );

    return (

        <View style={[styles.container, { backgroundColor: bg }]}>
            <ScreenHeader title="Meu Perfil" />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Header do Perfil */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatarContainer, { borderColor: primary }]}>
                        <Text style={[styles.avatarText, { color: primary }]}>
                            {user?.name?.charAt(0)}
                        </Text>
                    </View>
                    <Text style={[styles.userName, { color: text }]}>{user?.name}</Text>
                    <Text style={[styles.userEmail, { color: textSec }]}>{user?.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: primary + '15' }]}>
                        <Text style={[styles.roleText, { color: primary }]}>Técnico Sênior</Text>
                    </View>
                </View>

                {/* Estatísticas Rápidas */}
                <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: cardBg }]}>
                        <Text style={[styles.statValue, { color: text }]}>142</Text>
                        <Text style={[styles.statLabel, { color: textSec }]}>Calibrações</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: cardBg }]}>
                        <Text style={[styles.statValue, { color: text }]}>4.9</Text>
                        <Text style={[styles.statLabel, { color: textSec }]}>Avaliação</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: cardBg }]}>
                        <Text style={[styles.statValue, { color: text }]}>12</Text>
                        <Text style={[styles.statLabel, { color: textSec }]}>Pendentes</Text>
                    </View>
                </View>

                {/* Configurações */}
                <Text style={[styles.sectionTitle, { color: text }]}>Preferências</Text>
                <View style={[styles.sectionContainer, { backgroundColor: cardBg }]}>
                    <SettingItem icon="moon-outline" label="Modo Escuro" isSwitch value={false} />
                    <SettingItem icon="notifications-outline" label="Notificações" isSwitch value={true} />
                    <SettingItem icon="language-outline" label="Idioma" onPress={() => {}} />
                </View>

                <Text style={[styles.sectionTitle, { color: text, marginTop: 24 }]}>Conta</Text>
                <View style={[styles.sectionContainer, { backgroundColor: cardBg }]}>
                    <SettingItem icon="shield-checkmark-outline" label="Segurança" onPress={() => {}} />
                    <SettingItem icon="help-circle-outline" label="Ajuda e Suporte" onPress={() => {}} />
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: danger }]}
                    onPress={logout}
                >
                    <Ionicons name="log-out-outline" size={20} color={danger} />
                    <Text style={[styles.logoutText, { color: danger }]}>Sair da Conta</Text>
                </TouchableOpacity>

                <Text style={[styles.versionText, { color: textSec }]}>Versão 1.0.0 (Build 42)</Text>
            </ScrollView>
        </View>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    profileHeader: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: {
        width: 100, height: 100, borderRadius: 50, borderWidth: 3,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.03)'
    },
    avatarText: { fontSize: 40, fontFamily: Fonts.sansBold },
    userName: { fontSize: 24, fontFamily: Fonts.sansBold, marginBottom: 4 },
    userEmail: { fontSize: 16, fontFamily: Fonts.sans, marginBottom: 12 },
    roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    roleText: { fontSize: 12, fontFamily: Fonts.sansSemiBold },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, gap: 12 },
    statItem: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, elevation: 1, shadowOpacity: 0.05 },
    statValue: { fontSize: 20, fontFamily: Fonts.sansBold, marginBottom: 4 },
    statLabel: { fontSize: 12, fontFamily: Fonts.sans },

    sectionTitle: { fontSize: 16, fontFamily: Fonts.sansBold, marginBottom: 12, marginLeft: 4 },
    sectionContainer: { borderRadius: 16, overflow: 'hidden' },
    settingItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { fontSize: 16, fontFamily: Fonts.sans },

    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 40, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20
    },
    logoutText: { fontSize: 16, fontFamily: Fonts.sansSemiBold },
    versionText: { textAlign: 'center', fontSize: 12, fontFamily: Fonts.sans }
});