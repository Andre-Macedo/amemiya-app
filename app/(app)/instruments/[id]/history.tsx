import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Calibration } from '@/types/entities';

export default function InstrumentHistoryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const instrument = DUMMY_INSTRUMENTS.find(inst => inst.id === id);

    // Cores do tema
    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const borderColor = useThemeColor({}, 'border');

    // Cores semânticas
    const successColor = useThemeColor({}, 'success');
    const dangerColor = useThemeColor({}, 'danger');
    const warningColor = useThemeColor({}, 'warning');

    if (!instrument) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: textSecondary }}>Instrumento não encontrado.</Text>
            </View>
        );
    }

    const renderTimelineItem = ({ item, index }: { item: Calibration, index: number }) => {
        const isLast = index === (instrument.calibrations?.length || 0) - 1;

        // Configuração de estilo baseada no resultado
        let statusColor = textSecondary;
        let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

        switch (item.result) {
            case 'Aprovado':
                statusColor = successColor;
                iconName = 'checkmark-circle';
                break;
            case 'Reprovado':
                statusColor = dangerColor;
                iconName = 'close-circle';
                break;
            case 'Em Andamento':
                statusColor = warningColor;
                iconName = 'time';
                break;
        }

        return (
            <View style={styles.timelineRow}>
                {/* Coluna da Esquerda: Linha do Tempo */}
                <View style={styles.timelineLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: cardBg }]}>
                        <Ionicons name={iconName} size={20} color={statusColor} />
                    </View>
                    {!isLast && (
                        <View style={[styles.timelineLine, { backgroundColor: borderColor }]} />
                    )}
                </View>

                {/* Coluna da Direita: Card de Conteúdo */}
                <Pressable
                    onPress={() => router.push(`/calibration-details/${item.id}`)}
                    style={({ pressed }) => [
                        styles.cardContainer,
                        { backgroundColor: cardBg, opacity: pressed ? 0.7 : 1 }
                    ]}
                >
                    <View style={styles.cardHeader}>
                        <Text style={[styles.dateText, { color: textColor }]}>
                            {item.calibration_date}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {item.result}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={[styles.label, { color: textSecondary }]}>Técnico</Text>
                            <Text style={[styles.value, { color: textColor }]}>{item.performed_by}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={textSecondary} />
                    </View>
                </Pressable>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <FlatList
                data={instrument.calibrations}
                keyExtractor={(item) => item.id}
                renderItem={renderTimelineItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={48} color={textSecondary} />
                        <Text style={[styles.emptyText, { color: textSecondary }]}>
                            Nenhum histórico encontrado.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 20,
    },
    timelineRow: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
        width: 24,
    },
    iconContainer: {
        zIndex: 1, // Garante que o ícone fique sobre a linha
        borderRadius: 12,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
        marginBottom: 4,
    },
    cardContainer: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24, // Espaço entre os cards
        // Sombra sutil
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 16,
        fontFamily: Fonts.sansBold,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.sansSemiBold,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        fontFamily: Fonts.sans,
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        fontFamily: Fonts.sansSemiBold,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
        gap: 10,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.sans,
    }
});