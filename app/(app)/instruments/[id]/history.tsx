import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Calibration } from '@/types/entities';
import { ScreenHeader } from "@/components/screen-header";
import { useInstrument } from '@/hooks/use-instruments'; // <--- 1. Importar o Hook

// REMOVIDO: import { DUMMY_INSTRUMENTS } ...

export default function InstrumentHistoryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    // 2. Usar o Hook para buscar dados da API
    const { data: instrument, isLoading } = useInstrument(id);

    // Cores
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');
    const success = useThemeColor({}, 'success');
    const danger = useThemeColor({}, 'danger');
    const warning = useThemeColor({}, 'warning');
    const primary = useThemeColor({}, 'primary');

    // 3. Loading State (para não quebrar enquanto carrega)
    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    if (!instrument) return null;

    const renderTimelineItem = ({ item, index }: { item: Calibration, index: number }) => {
        const isLast = index === (instrument.calibrations?.length || 0) - 1;

        // Lógica Visual do Status
        let statusColor = textSec;
        let iconName: keyof typeof Ionicons.glyphMap = 'help';

        // Ajuste aqui conforme o que vem da sua API (Aprovado/Reprovado ou approved/rejected)
        if (item.result === 'Aprovado' || item.result === 'approved') {
            statusColor = success;
            iconName = 'checkmark-circle';
        } else if (item.result === 'Reprovado' || item.result === 'rejected') {
            statusColor = danger;
            iconName = 'close-circle';
        } else {
            statusColor = warning;
            iconName = 'time';
        }

        return (
            <View style={styles.timelineRow}>
                {/* --- Coluna da Esquerda (Linha do Tempo) --- */}
                <View style={styles.leftCol}>
                    <View style={[styles.dot, { backgroundColor: bg, borderColor: statusColor }]}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                    </View>
                    {!isLast && <View style={[styles.line, { backgroundColor: border }]} />}
                </View>

                {/* --- Coluna da Direita (Card) --- */}
                <View style={{ flex: 1, paddingBottom: 24 }}>
                    <Pressable
                        onPress={() => router.push(`/calibration-details/${item.id}`)}
                        style={({ pressed }) => [
                            styles.card,
                            { backgroundColor: cardBg, borderColor: border, opacity: pressed ? 0.7 : 1 }
                        ]}
                    >
                        {/* Cabeçalho do Card */}
                        <View style={styles.cardHeader}>
                            <View style={styles.dateBadge}>
                                <Ionicons name="calendar-outline" size={14} color={textSec} />
                                <Text style={[styles.dateText, { color: textSec }]}>{item.calibration_date}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                                <Ionicons name={iconName} size={14} color={statusColor} style={{ marginRight: 4 }} />
                                <Text style={[styles.statusText, { color: statusColor }]}>{item.result}</Text>
                            </View>
                        </View>

                        {/* Corpo do Card */}
                        <View style={styles.techRow}>
                            <View style={[styles.avatarPlaceholder, { backgroundColor: textSec + '30' }]}>
                                <Text style={{ color: text, fontSize: 12, fontFamily: Fonts.sansBold }}>
                                    {item.performed_by ? item.performed_by.charAt(0) : '-'}
                                </Text>
                            </View>
                            <Text style={[styles.techName, { color: text }]}>
                                Téc. {item.performed_by}
                            </Text>
                        </View>

                        {/* Seta de Navegação (Sutil) */}
                        <View style={styles.arrowContainer}>
                            <Text style={{ fontSize: 12, color: textSec, marginRight: 4 }}>Ver laudo</Text>
                            <Ionicons name="arrow-forward" size={16} color={textSec} />
                        </View>

                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <Stack.Screen options={{ title: 'Histórico', headerShadowVisible: false, headerStyle: { backgroundColor: bg } }} />

            <ScreenHeader title="Histórico" showBack />

            <FlatList
                data={instrument.calibrations} // Agora usa os dados da API
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTimelineItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons name="file-tray-outline" size={48} color={textSec} />
                        <Text style={[styles.emptyText, { color: textSec }]}>Nenhum registro encontrado</Text>
                    </View>
                }
            />
        </View>
    );
}

// Mantive os estilos exatamente iguais
const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 20 },
    timelineRow: { flexDirection: 'row' },
    leftCol: { width: 40, alignItems: 'center' },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    line: { flex: 1, width: 2, marginTop: -2, marginBottom: -2 },
    card: { borderRadius: 12, borderWidth: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 13, fontFamily: Fonts.sans },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontFamily: Fonts.sansBold },
    techRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarPlaceholder: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    techName: { fontSize: 14, fontFamily: Fonts.sansSemiBold },
    arrowContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 },
    emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontSize: 16, fontFamily: Fonts.sans }
});