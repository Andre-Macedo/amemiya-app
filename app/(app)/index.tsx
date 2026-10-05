import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/stat-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardStats } from '@/hooks/use-instruments';

export default function HomeScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const router = useRouter();

    const themeBg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const success = useThemeColor({}, 'success');
    const danger = useThemeColor({}, 'danger');
    const warning = useThemeColor({}, 'warning');
    const border = useThemeColor({}, 'border');

    const { data: stats, isLoading, isError, error, refetch, isRefetching } = useDashboardStats();

    // Atualiza automaticamente os dados sempre que a tela ganha foco
    useFocusEffect(
        React.useCallback(() => {
            refetch();
        }, [refetch])
    );

    const toggleMenu = () => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/D';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    if (isLoading && !stats) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={primary} />
                <Text style={[{ color: textSecondary, marginTop: 12, fontFamily: Fonts.sans }]}>
                    Carregando dados da metrologia...
                </Text>
            </SafeAreaView>
        );
    }

    const isUnauthorized = (error as any)?.response?.status === 401;

    if (isError && !stats) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeBg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Ionicons name={isUnauthorized ? 'lock-closed-outline' : 'alert-circle-outline'} size={52} color={danger} />
                <Text style={[{ color: textColor, fontSize: 18, fontFamily: Fonts.sansBold, marginTop: 16, textAlign: 'center' }]}>
                    {isUnauthorized ? 'Sessão Expirada' : 'Erro ao Carregar Dados'}
                </Text>
                <Text style={[{ color: textSecondary, fontSize: 13, fontFamily: Fonts.sans, marginTop: 8, textAlign: 'center', marginBottom: 20 }]}>
                    {isUnauthorized
                        ? 'Sua sessão expirou ou o banco de dados foi reiniciado. Por favor, faça login com suas credenciais novamente.'
                        : 'Não foi possível obter as informações do servidor. Verifique se o backend está em execução.'}
                </Text>
                <Pressable
                    onPress={() => (isUnauthorized ? router.replace('/(auth)/login' as any) : refetch())}
                    style={({ pressed }) => [
                        {
                            backgroundColor: primary,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                            opacity: pressed ? 0.8 : 1,
                        },
                    ]}
                >
                    <Text style={{ color: '#fff', fontFamily: Fonts.sansBold, fontSize: 14 }}>
                        {isUnauthorized ? 'Fazer Login' : 'Tentar Novamente'}
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const activeCount = stats?.kpi?.active_count ?? stats?.active_count ?? 0;
    const overdueCount = stats?.kpi?.overdue_count ?? stats?.overdue_count ?? 0;
    const inCalibrationCount = stats?.kpi?.in_calibration_count ?? stats?.calibration_count ?? 0;
    const totalStandards = stats?.kpi?.total_standards ?? stats?.total_standards ?? 0;
    const complianceRate = stats?.kpi?.compliance_rate ?? stats?.compliance_rate ?? 0;

    const upcomingDue = stats?.upcoming_due || [];
    const recentCalibrations = stats?.recent_calibrations || [];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={primary}
                        colors={[primary]}
                    />
                }
            >
                {/* Header Customizado */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: textSecondary }]}>Bem-vindo de volta,</Text>
                        <Text style={[styles.userName, { color: textColor }]}>
                            {user?.name ? user.name.split(' ')[0] : 'Metrologista'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable
                            onPress={() => refetch()}
                            style={[styles.menuButton, { backgroundColor: primary + '15' }]}
                            accessibilityLabel="Atualizar dados"
                            disabled={isRefetching}
                        >
                            {isRefetching ? (
                                <ActivityIndicator size="small" color={primary} />
                            ) : (
                                <Ionicons name="refresh-outline" size={22} color={primary} />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={toggleMenu}
                            style={[styles.menuButton, { backgroundColor: primary + '15' }]}
                            accessibilityLabel="Abrir menu lateral"
                        >
                            <Ionicons name="menu" size={24} color={primary} />
                        </Pressable>
                    </View>
                </View>

                {/* Banner de Conformidade Metrológica */}
                <View style={[styles.complianceCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.complianceHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.complianceTitle, { color: textSecondary }]}>Conformidade Metrológica</Text>
                            <Text style={[styles.compliancePercent, { color: complianceRate >= 80 ? success : warning }]}>
                                {complianceRate.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={[styles.complianceBadge, { backgroundColor: (complianceRate >= 80 ? success : warning) + '15' }]}>
                            <Ionicons
                                name={complianceRate >= 80 ? 'shield-checkmark' : 'alert-circle'}
                                size={20}
                                color={complianceRate >= 80 ? success : warning}
                            />
                            <Text style={[styles.complianceBadgeText, { color: complianceRate >= 80 ? success : warning }]}>
                                {complianceRate >= 80 ? 'Conforme' : 'Atenção'}
                            </Text>
                        </View>
                    </View>
                    {/* Barra de progresso */}
                    <View style={[styles.progressBarBg, { backgroundColor: border }]}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${Math.min(100, Math.max(0, complianceRate))}%`,
                                    backgroundColor: complianceRate >= 80 ? success : warning,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Grid de Estatísticas */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>Visão Geral do Parque</Text>
                <View style={styles.gridContainer}>
                    <StatCard
                        title="Ativos"
                        value={activeCount.toString()}
                        icon="checkmark-circle-outline"
                        type="success"
                    />
                    <StatCard
                        title="Vencidos"
                        value={overdueCount.toString()}
                        icon="alert-circle-outline"
                        type="danger"
                    />
                    <StatCard
                        title="Em Calibração"
                        value={inCalibrationCount.toString()}
                        icon="time-outline"
                        type="warning"
                    />
                    <StatCard
                        title="Total Padrões"
                        value={totalStandards.toString()}
                        icon="cube-outline"
                        type="neutral"
                    />
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: textColor, marginTop: 28 }]}>Ações Rápidas</Text>
                <View style={styles.actionsContainer}>
                    <QuickActionButton
                        icon="qr-code-outline"
                        label="Escanear"
                        onPress={() => router.push('/scanner' as any)}
                    />
                    <QuickActionButton
                        icon="hardware-chip-outline"
                        label="Sensores IoT"
                        onPress={() => router.push('/iot' as any)}
                    />
                    <QuickActionButton
                        icon="analytics-outline"
                        label="Checagem"
                        onPress={() => router.push('/intermediate-check' as any)}
                    />
                    <QuickActionButton
                        icon="business-outline"
                        label="Postos"
                        onPress={() => router.push('/stations' as any)}
                    />
                </View>

                {/* Próximos Vencimentos */}
                {upcomingDue.length > 0 && (
                    <View style={{ marginTop: 28 }}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>
                                Próximos a Vencer
                            </Text>
                            <Pressable onPress={() => router.push('/(app)/instruments' as any)}>
                                <Text style={[styles.seeAllText, { color: primary }]}>Ver todos</Text>
                            </Pressable>
                        </View>
                        <View style={{ marginTop: 12, gap: 8 }}>
                            {upcomingDue.map((item) => (
                                <Pressable
                                    key={item.id}
                                    style={[styles.dueItemCard, { backgroundColor: cardBg, borderColor: border }]}
                                    onPress={() => router.push(`/(app)/instruments/${item.id}` as any)}
                                >
                                    <View style={[styles.dueIconWrapper, { backgroundColor: warning + '15' }]}>
                                        <Ionicons name="calendar-outline" size={18} color={warning} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.dueItemName, { color: textColor }]} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.dueItemSub, { color: textSecondary }]}>
                                            S/N: {item.serial_number}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.dueDateBadge, { color: warning }]}>
                                            {formatDate(item.calibration_due)}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Últimas Calibrações */}
                {recentCalibrations.length > 0 && (
                    <View style={{ marginTop: 28, marginBottom: 20 }}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Últimas Calibrações</Text>
                        <View style={{ gap: 8 }}>
                            {recentCalibrations.map((cal) => (
                                <View
                                    key={cal.id}
                                    style={[styles.dueItemCard, { backgroundColor: cardBg, borderColor: border }]}
                                >
                                    <View
                                        style={[
                                            styles.dueIconWrapper,
                                            { backgroundColor: (cal.result === 'approved' ? success : danger) + '15' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={cal.result === 'approved' ? 'checkmark-done' : 'close-circle'}
                                            size={18}
                                            color={cal.result === 'approved' ? success : danger}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.dueItemName, { color: textColor }]} numberOfLines={1}>
                                            {cal.item_name}
                                        </Text>
                                        <Text style={[styles.dueItemSub, { color: textSecondary }]}>
                                            {formatDate(cal.date)} {cal.certificate ? `• Cert: ${cal.certificate}` : ''}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusPill,
                                            { backgroundColor: (cal.result === 'approved' ? success : danger) + '15' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusPillText,
                                                { color: cal.result === 'approved' ? success : danger },
                                            ]}
                                        >
                                            {cal.result === 'approved' ? 'Aprovado' : 'Reprovado'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// Componente auxiliar para botões rápidos
const QuickActionButton = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => {
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    return (
        <Pressable
            style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: cardBg, borderColor: border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onPress}
        >
            <Ionicons name={icon} size={22} color={primary} style={{ marginBottom: 6 }} />
            <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 6,
    },
    menuButton: {
        padding: 10,
        borderRadius: 12,
    },
    greeting: {
        fontSize: 13,
        fontFamily: Fonts.sans,
    },
    userName: {
        fontSize: 22,
        fontFamily: Fonts.sansBold,
        marginTop: 2,
    },
    complianceCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    complianceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    complianceTitle: {
        fontSize: 12,
        fontFamily: Fonts.sans,
    },
    compliancePercent: {
        fontSize: 26,
        fontFamily: Fonts.sansBold,
        marginTop: 2,
    },
    complianceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    complianceBadgeText: {
        fontSize: 12,
        fontFamily: Fonts.sansBold,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.sansBold,
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 11,
        fontFamily: Fonts.sansSemiBold,
        textAlign: 'center',
    },
    dueItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
    },
    dueIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dueItemName: {
        fontSize: 13,
        fontFamily: Fonts.sansBold,
    },
    dueItemSub: {
        fontSize: 11,
        fontFamily: Fonts.sans,
        marginTop: 2,
    },
    dueDateBadge: {
        fontSize: 12,
        fontFamily: Fonts.sansBold,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusPillText: {
        fontSize: 11,
        fontFamily: Fonts.sansBold,
    },
});