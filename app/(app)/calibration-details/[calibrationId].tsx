// app/(app)/calibration-details/[id].tsx

import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Calibration } from '@/types/entities';
import {useSafeAreaInsets} from "react-native-safe-area-context";

// Hook interno para buscar apenas uma calibração (poderia estar em /hooks)
function useCalibration(calibrationId: string) {
    return useQuery({
        queryKey: ['calibration', calibrationId],
        queryFn: async () => {
            console.log(`Buscando calibração ID: ${calibrationId}`); // Debug
            try {
                const { data } = await api.get<{ data: Calibration }>(`/calibrations/${calibrationId}`);
                return data.data;
            } catch (e) {
                console.error("Erro ao buscar calibração:", e);
                throw e;
            }
        },
        enabled: !!calibrationId
    });
}


export default function CalibrationDetailsScreen() {
    // Agora o parâmetro é 'calibrationId' (da rota [calibrationId].tsx), não 'calibrationId'
    const { calibrationId } = useLocalSearchParams<{ calibrationId: string }>();

    // Busca dados reais da API
    const { data: calibration, isLoading, error } = useCalibration(calibrationId);

    const insets = useSafeAreaInsets();

    // Cores
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');
    const success = useThemeColor({}, 'success');
    const danger = useThemeColor({}, 'danger');
    const warning = useThemeColor({}, 'warning');

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    if (error || !calibration) {
        return (
            <View style={[styles.container, { backgroundColor: bg }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ScreenHeader title="Detalhes" showBack />
                <View style={styles.notFound}>
                    <Ionicons name="alert-circle-outline" size={48} color={textSec} />
                    <Text style={[styles.notFoundText, { color: textSec }]}>Calibração não encontrada ou erro na API.</Text>
                </View>
            </View>
        );
    }

    // Lógica de Cores do Status
    let statusColor = textSec;
    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

    if (calibration.result === 'Aprovado') {
        statusColor = success;
        iconName = 'checkmark-circle';
    } else if (calibration.result === 'Reprovado') {
        statusColor = danger;
        iconName = 'close-circle';
    } else {
        statusColor = warning;
        iconName = 'time';
    }

    const handleDownload = async () => {
        if (!calibration) return;

        const baseUrl = api.defaults.baseURL || '';
        const downloadUrl = `${baseUrl}/calibrations/${calibration.id}/pdf`;

        try {
            const supported = await Linking.canOpenURL(downloadUrl);

            if (supported) {
                await Linking.openURL(downloadUrl);
            } else {
                alert(`Não é possível abrir este link: ${downloadUrl}`);
            }
        } catch (error) {
            console.error("Erro ao abrir PDF:", error);
            alert('Erro ao tentar baixar o certificado.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={`Certificado #${calibration.id}`} showBack />

            <ScrollView contentContainerStyle={styles.content}>

                {/* --- Card de Resultado (Destaque Visual) --- */}
                <View style={[styles.resultCard, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                    <View style={styles.resultIconBox}>
                        <Ionicons name={iconName} size={48} color={statusColor} />
                    </View>
                    <View>
                        <Text style={[styles.resultLabel, { color: statusColor }]}>Resultado da Calibração</Text>
                        <Text style={[styles.resultValue, { color: statusColor }]}>{calibration.result}</Text>
                    </View>
                </View>

                {/* --- Dados Técnicos --- */}
                <Text style={[styles.sectionTitle, { color: text }]}>Dados do Evento</Text>
                <View style={[styles.detailsCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <DetailRow label="Data de Execução" value={calibration.calibration_date} icon="calendar-outline" color={text} sub={textSec} />
                    <DetailRow label="Técnico Responsável" value={calibration.performed_by} icon="person-outline" color={text} sub={textSec} />
                    <DetailRow label="ID do Checklist" value={calibration.checklist_id} icon="list-outline" color={text} sub={textSec} />
                </View>

                {/* --- Observações (Se houver) --- */}
                {calibration.notes && (
                    <>
                        <Text style={[styles.sectionTitle, { color: text, marginTop: 24 }]}>Observações</Text>
                        <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor: border }]}>
                            <Text style={[styles.noteText, { color: text }]}>{calibration.notes}</Text>
                        </View>
                    </>
                )}

            </ScrollView>

            {/* --- Botão de Download Fixo --- */}
            <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: border, paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20
            }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.downloadButton,
                        { backgroundColor: primary, opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={handleDownload}
                >
                    <Ionicons name="document-text-outline" size={24} color="#FFF" />
                    <Text style={styles.downloadText}>Baixar Certificado PDF</Text>
                </Pressable>
            </View>
        </View>
    );
}

const DetailRow = ({ label, value, icon, color, sub }: any) => (
    <View style={styles.row}>
        <View style={styles.rowLeft}>
            <Ionicons name={icon} size={20} color={sub} />
            <Text style={[styles.rowLabel, { color: sub }]}>{label}</Text>
        </View>
        <Text style={[styles.rowValue, { color: color }]}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },

    // Not Found
    notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    notFoundText: { fontSize: 16, fontFamily: Fonts.sans },

    // Result Card
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
        gap: 16,
    },
    resultIconBox: {},
    resultLabel: { fontSize: 14, fontFamily: Fonts.sansSemiBold, opacity: 0.8, marginBottom: 4 },
    resultValue: { fontSize: 24, fontFamily: Fonts.sansBold },

    // Details
    sectionTitle: { fontSize: 16, fontFamily: Fonts.sansBold, marginBottom: 12, marginLeft: 4 },
    detailsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

    // Row Component
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowLabel: { fontSize: 14, fontFamily: Fonts.sans },
    rowValue: { fontSize: 14, fontFamily: Fonts.sansSemiBold },

    // Notes
    noteCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
    noteText: { fontSize: 14, fontFamily: Fonts.sans, lineHeight: 22 },

    // Footer Action
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
        paddingBottom: 30,
    },
    downloadButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    downloadText: { color: '#FFF', fontSize: 16, fontFamily: Fonts.sansBold }
});