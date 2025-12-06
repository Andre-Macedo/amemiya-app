import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/stat-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardStats } from '@/hooks/use-instruments';
import { ActivityIndicator } from 'react-native';


export default function HomeScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const router = useRouter();

    const themeBg = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');

    const { data: stats, isLoading } = useDashboardStats();

    if (isLoading) return <ActivityIndicator style={{marginTop: 50}} />;

    const toggleMenu = () => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header Customizado (Substitui o padrão) */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: textSecondary }]}>Bem-vindo de volta,</Text>
                        <Text style={[styles.userName, { color: textColor }]}>{user?.name?.split(' ')[0]}</Text>
                    </View>
                    <Pressable onPress={toggleMenu} style={[styles.menuButton, { backgroundColor: primary + '10' }]}>
                        <Ionicons name="menu" size={24} color={primary} />
                    </Pressable>
                </View>

                {/* Grid de Estatísticas */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>Visão Geral</Text>
                <View style={styles.gridContainer}>
                    <StatCard
                        title="Ativos"
                        value={stats?.active_count?.toString() || "0"}
                        icon="checkmark-circle-outline"
                        type="success"
                    />
                    <StatCard
                        title="Vencidos"
                        value={stats?.overdue_count?.toString() || "0"}
                        icon="alert-circle-outline"
                        type="danger"
                    />
                    <StatCard
                        title="Em Calibração"
                        value={stats?.calibration_count?.toString() || "0"}
                        icon="time-outline"
                        type="warning"
                    />
                    <StatCard
                        title="Total Padrões"
                        value="34"
                        icon="cube-outline"
                        type="neutral"
                    />
                </View>

                {/* Quick Actions (UX Melhorada para acesso rápido) */}
                <Text style={[styles.sectionTitle, { color: textColor, marginTop: 30 }]}>Ações Rápidas</Text>
                <View style={styles.actionsContainer}>
                    <QuickActionButton
                        icon="qr-code-outline"
                        label="Escanear"
                        onPress={() => console.log("Scan")}
                    />
                    <QuickActionButton
                        icon="add-circle-outline"
                        label="Novo Instrumento"
                        onPress={() => console.log("Novo")}
                    />
                    <QuickActionButton
                        icon="search-outline"
                        label="Buscar"
                        onPress={() => router.push('/instruments')}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// Componente auxiliar para botões rápidos
const QuickActionButton = ({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) => {
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const primary = useThemeColor({}, 'primary');

    return (
        <Pressable
            style={({pressed}) => [styles.actionButton, { backgroundColor: cardBg, opacity: pressed ? 0.7 : 1 }]}
            onPress={onPress}
        >
            <Ionicons name={icon} size={24} color={primary} style={{ marginBottom: 8 }} />
            <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10, // Ajuste fino por causa do SafeArea
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    menuButton: {
        padding: 10,
        borderRadius: 12,
    },
    greeting: {
        fontSize: 14,
        fontFamily: Fonts.sans,
    },
    userName: {
        fontSize: 24,
        fontFamily: Fonts.sansBold,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.sansBold,
        marginBottom: 15,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        // Sombra suave
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLabel: {
        fontSize: 12,
        fontFamily: Fonts.sansSemiBold,
        textAlign: 'center',
    }
});