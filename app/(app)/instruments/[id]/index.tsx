import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable, useColorScheme, ActivityIndicator} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';
import {useInstrument} from "@/hooks/use-instruments";
import {useSafeAreaInsets} from "react-native-safe-area-context"; // Importe o novo header

export default function InstrumentDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const insets = useSafeAreaInsets();
    const theme = useColorScheme() ?? 'light';

    // Busca o instrumento real pelo ID
    const { data: instrument, isLoading, error } = useInstrument(id);
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');
    const success = useThemeColor({}, 'success');
    const danger = useThemeColor({}, 'danger');
    const warning = useThemeColor({}, 'warning');

// 1. Estado de Carregamento (Loading)
    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={primary} />
                <Text style={{ marginTop: 10, color: textSec, fontFamily: Fonts.sans }}>Carregando instrumento...</Text>
            </View>
        );
    }

    // 2. Estado de Erro ou Não Encontrado (só aparece se NÃO estiver carregando e NÃO tiver dados)
    if (error || !instrument) {
        return (
            <View style={[styles.container, { backgroundColor: bg }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ScreenHeader title="Detalhes" showBack />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="alert-circle-outline" size={48} color={textSec} />
                    <Text style={{ color: textSec, marginTop: 10, fontFamily: Fonts.sans }}>
                        Instrumento não encontrado.
                    </Text>
                </View>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        if (status === 'Ativo') return success;
        if (status === 'Vencido') return danger;
        if (status === 'Em Calibração') return warning;
        return textSec;
    };
    const statusColor = getStatusColor(instrument.status);

    return (
        <View style={[styles.container, { backgroundColor: bg}]}>
            {/* Esconde o header nativo do Stack e usa o nosso */}
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Detalhes do Instrumento" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <View style={[styles.iconBox, { backgroundColor: primary + '15' }]}>
                        <Ionicons name="cube-outline" size={32} color={primary} />
                    </View>
                    <View style={styles.headerTexts}>
                        <Text style={[styles.title, { color: text }]}>{instrument.name}</Text>
                        <Text style={[styles.serial, { color: textSec }]}>S/N: {instrument.stock_number}</Text>
                    </View>
                </View>

                <View style={[styles.statusCard, { backgroundColor: statusColor + '10', borderColor: statusColor }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="information-circle" size={24} color={statusColor} />
                        <Text style={[styles.statusLabel, { color: statusColor }]}>Status Atual</Text>
                    </View>
                    <Text style={[styles.statusValue, { color: statusColor }]}>{instrument.status}</Text>
                </View>

                <Text style={[styles.sectionTitle, { color: text }]}>Especificações</Text>
                <View style={[styles.gridContainer, { backgroundColor: cardBg }]}>
                    <DetailItem label="Tipo" value={instrument.instrument_type} icon="construct-outline" color={text} subColor={textSec} />
                    <DetailItem label="Localização" value={instrument.station.name} icon="location-outline" color={text} subColor={textSec} />
                    <DetailItem label="Precisão" value={instrument.precision} icon="scan-outline" color={text} subColor={textSec} />
                    <DetailItem label="Última Calib." value="15/05/2024" icon="calendar-outline" color={text} subColor={textSec} />
                </View>

                <Pressable
                    style={({pressed}) => [
                        styles.actionButton,
                        { backgroundColor: cardBg, borderColor: border, opacity: pressed ? 0.7 : 1 }
                    ]}
                    onPress={() => router.push(`/instruments/${id}/history`)}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <View style={[styles.miniIcon, { backgroundColor: primary + '10' }]}>
                            <Ionicons name="time-outline" size={20} color={primary} />
                        </View>
                        <View>
                            <Text style={[styles.actionTitle, { color: text }]}>Histórico de Calibração</Text>
                            <Text style={[styles.actionSub, { color: textSec }]}>Ver todos os certificados</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={textSec} />
                </Pressable>
            </ScrollView>

            <Pressable
                style={({pressed}) => [styles.fab, { backgroundColor: primary, opacity: pressed ? 0.8 : 1, bottom: 20 + insets.bottom, }]}
                onPress={() => {
                    // Navega PASSANDO O PARÂMETRO 'preselectedInstrumentId'
                    router.push({
                        pathname: '/(app)/calibration',
                        params: { preselectedInstrumentId: id } // 'id' vem do useLocalSearchParams
                    });
                }}
            >
                <Ionicons name="add" size={28} color="#FFF" />
                <Text style={styles.fabText}>Nova Calibração</Text>
            </Pressable>
        </View>
    );
}

const DetailItem = ({ label, value, icon, color, subColor }: any) => (
    <View style={styles.detailItem}>
        <Ionicons name={icon} size={20} color={subColor} style={{ marginBottom: 4 }} />
        <Text style={[styles.detailLabel, { color: subColor }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: color }]} numberOfLines={1}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    headerTexts: { flex: 1 },
    title: { fontSize: 22, fontFamily: Fonts.sansBold },
    serial: { fontSize: 14, fontFamily: Fonts.sans, marginTop: 4 },
    statusCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusLabel: { fontSize: 14, fontFamily: Fonts.sansSemiBold },
    statusValue: { fontSize: 16, fontFamily: Fonts.sansBold },
    sectionTitle: { fontSize: 18, fontFamily: Fonts.sansBold, marginBottom: 12 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, padding: 16, gap: 24 },
    detailItem: { width: '44%' },
    detailLabel: { fontSize: 12, fontFamily: Fonts.sans, marginBottom: 2 },
    detailValue: { fontSize: 15, fontFamily: Fonts.sansSemiBold },
    actionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 24 },
    miniIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionTitle: { fontSize: 16, fontFamily: Fonts.sansSemiBold },
    actionSub: { fontSize: 12, fontFamily: Fonts.sans },
    fab: { position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height: 4} },
    fabText: { color: '#FFF', fontFamily: Fonts.sansBold, fontSize: 16, marginLeft: 8 }
});