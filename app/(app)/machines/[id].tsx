import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useMachineDetails } from '@/hooks/use-machines';
import { SensorIhmCard } from '@/components/iot/sensor-ihm-card';

export default function MachineDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');
    const success = useThemeColor({}, 'success');
    const warning = useThemeColor({}, 'warning');

    const { data: machine, isLoading } = useMachineDetails(id);

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    if (!machine) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ScreenHeader title="Máquina" showBack />
                <Text style={{ color: textSec, marginTop: 20 }}>Máquina não encontrada.</Text>
            </View>
        );
    }

    const isOperational = machine.status === 'operational';
    const metadata = (machine.metadata || {}) as Record<string, any>;
    const metadataEntries = Object.entries(metadata);

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={machine.name} showBack />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Card de Acesso ao Terminal IHM Operacional (Tela Cheia / LCD 3.5") */}
                <Pressable
                    style={[styles.hmiBannerCard, { borderColor: '#00E67644' }]}
                    onPress={() => router.push(`/machines/${machine.id}/hmi` as any)}
                >
                    <View style={styles.hmiBannerLeft}>
                        <View style={styles.hmiIconContainer}>
                            <Ionicons name="tv-outline" size={24} color="#00E676" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.hmiBannerTitle}>Terminal IHM Operacional</Text>
                                <View style={styles.hmiResolutionPill}>
                                    <Text style={styles.hmiResolutionText}>{'LCD 3.5"'}</Text>
                                </View>
                            </View>
                            <Text style={styles.hmiBannerSubtitle}>
                                Monitoramento dinâmico: ISO 20816, Tacômetro Real e Sonda Acústica
                            </Text>
                        </View>
                    </View>
                    <View style={styles.hmiOpenButton}>
                        <Text style={styles.hmiOpenButtonText}>Abrir IHM</Text>
                        <Ionicons name="arrow-forward" size={14} color="#00E676" />
                    </View>
                </Pressable>

                {/* Card de Silenciador e Alarme (Buzzer & ACK) */}
                <Pressable
                    style={[styles.hmiBannerCard, { borderColor: '#DD6B2044', backgroundColor: '#DD6B2010', marginTop: 10 }]}
                    onPress={() => router.push({ pathname: '/(app)/remote-control', params: { machineId: machine.id } } as any)}
                >
                    <View style={styles.hmiBannerLeft}>
                        <View style={[styles.hmiIconContainer, { backgroundColor: '#DD6B2020' }]}>
                            <Ionicons name="volume-mute-outline" size={24} color="#DD6B20" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.hmiBannerTitle, { color: '#DD6B20' }]}>Silenciador de Alarme</Text>
                                <View style={[styles.hmiResolutionPill, { backgroundColor: '#FEEBC8' }]}>
                                    <Text style={[styles.hmiResolutionText, { color: '#C05621' }]}>BUZZER & ACK</Text>
                                </View>
                            </View>
                            <Text style={styles.hmiBannerSubtitle}>
                                Silenciar Buzzer, Reconhecer Alarme e Teste Sonoro (BLE / MQTT)
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.hmiOpenButton, { backgroundColor: '#DD6B2015' }]}>
                        <Text style={[styles.hmiOpenButtonText, { color: '#DD6B20' }]}>Silenciar</Text>
                        <Ionicons name="arrow-forward" size={14} color="#DD6B20" />
                    </View>
                </Pressable>

                {/* Card de Abertura Rápida de Ordem de Serviço */}
                <Pressable
                    style={[styles.hmiBannerCard, { borderColor: '#3182CE44', backgroundColor: '#3182CE10', marginTop: 10 }]}
                    onPress={() => router.push({
                        pathname: '/(app)/work-orders/create',
                        params: { machineId: machine.id, machineName: machine.name },
                    } as any)}
                >
                    <View style={styles.hmiBannerLeft}>
                        <View style={[styles.hmiIconContainer, { backgroundColor: '#3182CE20' }]}>
                            <Ionicons name="construct-outline" size={24} color="#3182CE" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.hmiBannerTitle, { color: '#3182CE' }]}>Ordem de Serviço</Text>
                                <View style={[styles.hmiResolutionPill, { backgroundColor: '#BEE3F8' }]}>
                                    <Text style={[styles.hmiResolutionText, { color: '#2B6CB0' }]}>CAMPO & FOTO</Text>
                                </View>
                            </View>
                            <Text style={styles.hmiBannerSubtitle}>
                                Registrar O.S. preditiva ou corretiva com evidência fotográfica
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.hmiOpenButton, { backgroundColor: '#3182CE15' }]}>
                        <Text style={[styles.hmiOpenButtonText, { color: '#3182CE' }]}>Criar O.S.</Text>
                        <Ionicons name="arrow-forward" size={14} color="#3182CE" />
                    </View>
                </Pressable>

                {/* Header Card da Máquina */}
                <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.headerRow}>
                        <View style={[styles.iconBox, { backgroundColor: primary + '15' }]}>
                            <Ionicons name="cog" size={26} color={primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.title, { color: text }]}>{machine.name}</Text>
                            <Text style={[styles.codeText, { color: textSec }]}>
                                Código: {machine.code || 'S/N'}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: (isOperational ? success : warning) + '15' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: isOperational ? success : warning },
                                ]}
                            >
                                {isOperational ? 'Operacional' : machine.status}
                            </Text>
                        </View>
                    </View>

                    {machine.description && (
                        <Text style={[styles.desc, { color: textSec }]}>
                            {machine.description}
                        </Text>
                    )}
                </View>

                {/* Especificações Técnicas (Metadados) */}
                {metadataEntries.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={[styles.sectionTitle, { color: text }]}>
                            Especificações Técnicas
                        </Text>
                        <View style={[styles.metaCard, { backgroundColor: cardBg, borderColor: border }]}>
                            {metadataEntries.map(([key, value], idx) => (
                                <View
                                    key={key}
                                    style={[
                                        styles.metaRow,
                                        idx < metadataEntries.length - 1 && { borderBottomColor: border, borderBottomWidth: 1 },
                                    ]}
                                >
                                    <Text style={[styles.metaKey, { color: textSec }]}>
                                        {formatMetaLabel(key)}
                                    </Text>
                                    <Text style={[styles.metaVal, { color: text }]}>
                                        {String(value)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Posto de Trabalho / Bancada Vinculada */}
                {machine.station && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={[styles.sectionTitle, { color: text }]}>
                            Posto de Trabalho
                        </Text>
                        <Pressable
                            style={[styles.stationCard, { backgroundColor: cardBg, borderColor: border }]}
                            onPress={() => router.push(`/stations/${machine.station!.id}` as any)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: primary + '15' }]}>
                                <Ionicons name="business-outline" size={22} color={primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.stationName, { color: text }]}>
                                    {machine.station.name}
                                </Text>
                                <Text style={[styles.stationSub, { color: textSec }]}>
                                    {machine.station.location || 'Chão de Fábrica'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={textSec} />
                        </Pressable>
                    </View>
                )}

                {/* Sensores IoT & Telemetria em Tempo Real */}
                <Text style={[styles.sectionTitle, { color: text }]}>
                    Sensores IoT Monitorando a Máquina ({machine.nodes?.length ?? 0})
                </Text>
                {machine.nodes && machine.nodes.length > 0 ? (
                    machine.nodes.map(node => (
                        <SensorIhmCard
                            key={node.id}
                            node={node}
                            onPress={() => router.push(`/iot/${node.id}` as any)}
                        />
                    ))
                ) : (
                    <Text style={[styles.emptySection, { color: textSec }]}>
                        Nenhum sensor de borda IoT vinculado a esta máquina.
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

function formatMetaLabel(key: string): string {
    const labels: Record<string, string> = {
        brand: 'Fabricante',
        model: 'Modelo',
        power_kw: 'Potência (kW)',
        nominal_rpm: 'Rotação Nominal (RPM)',
        clamping_force_ton: 'Força de Fechamento (t)',
        axes: 'Eixos Controlados',
        criticality: 'Criticidade Operacional',
        granite_grade: 'Classe do Granito',
        dimensions: 'Dimensões Físicas',
        target_temp_c: 'Temperatura Alvo (°C)',
        target_humidity_pct: 'Umidade Alvo (%)',
        temp_tolerance_c: 'Tolerância Térmica (±°C)',
    };
    return labels[key] || key.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 16,
    },
    infoCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: Fonts.sansBold,
        fontSize: 18,
    },
    codeText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
        textTransform: 'capitalize',
    },
    desc: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        marginTop: 14,
        lineHeight: 18,
    },
    hmiBannerCard: {
        backgroundColor: '#0F1622',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1.5,
        elevation: 3,
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    hmiBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hmiIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#00E67618',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hmiBannerTitle: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 15,
    },
    hmiResolutionPill: {
        backgroundColor: '#1E2C42',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    hmiResolutionText: {
        color: '#00E676',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
    },
    hmiBannerSubtitle: {
        color: '#90A4AE',
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 3,
        lineHeight: 16,
    },
    hmiOpenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#1A2332',
    },
    hmiOpenButtonText: {
        color: '#00E676',
        fontFamily: Fonts.sansBold,
        fontSize: 13,
    },
    sectionTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        marginBottom: 10,
    },
    metaCard: {
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    metaKey: {
        fontFamily: Fonts.sans,
        fontSize: 13,
    },
    metaVal: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    stationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    stationName: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    stationSub: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
    },
    emptySection: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 16,
    },
});
