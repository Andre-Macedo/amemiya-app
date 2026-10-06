import React from 'react';
import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Machine, IoTNode, ISO20816Severity } from '@/types/entities';

// Resolução e proporção de referência para LCD 3.5" (ex: ILI9488 / ST7796 / WT32-SC01 Plus)
export const LCD_35_WIDTH = 480;
export const LCD_35_HEIGHT = 320;
export const LCD_35_ASPECT_RATIO = LCD_35_WIDTH / LCD_35_HEIGHT; // 1.5 (3:2)

interface MachineHmiPanelProps {
    machine: Machine;
    nodes?: IoTNode[];
    isLandscapeFullscreen?: boolean;
}

export function MachineHmiPanel({
    machine,
    nodes = [],
    isLandscapeFullscreen = false,
}: MachineHmiPanelProps) {
    const { width: windowWidth } = useWindowDimensions();

    // No modo inline, calculamos a largura para ocupar o container mantendo proporção 3:2 (ou limitada a 480)
    // No modo landscape fullscreen, ocupa a largura total respeitando o aspect ratio
    const containerWidth = isLandscapeFullscreen
        ? Math.min(windowWidth - 32, 540)
        : Math.min(windowWidth - 32, 480);
    const containerHeight = containerWidth / LCD_35_ASPECT_RATIO;
    const scaleFactor = containerWidth / LCD_35_WIDTH;

    // Agregar leituras dos nós IoT acoplados à máquina
    const primaryNode = nodes[0];
    const tel = primaryNode?.latest_telemetry;

    // Status operacional
    const isOperational = machine.status === 'operational';
    const hasOnlineNode = nodes.some(n => n.status === 'online');

    // Métricas reais dos sensores de hardware na máquina
    const probeTemp = tel?.probe_temperature ?? tel?.temperature ?? (machine.metadata?.target_temp_c as number | undefined);
    const vibRms = tel?.vibration_rms ?? 0.85;
    const severity: ISO20816Severity = tel?.iso20816_severity ?? (vibRms > 4.5 ? 'D' : vibRms > 2.8 ? 'C' : vibRms > 1.8 ? 'B' : 'A');
    const mlRisk = tel?.ml_anomaly_probability ?? (vibRms > 3.0 ? 0.65 : 0.08);

    // Rotação real via Tacômetro (ou fallback nominal da máquina se parado)
    const realRpm = tel?.rpm_measured ?? (isOperational ? (machine.metadata?.nominal_rpm ?? machine.metadata?.spindle_rpm ?? 1750) : 0);
    const nominalRpm = machine.metadata?.nominal_rpm ?? machine.metadata?.spindle_rpm ?? null;

    // Microfone na Máquina (Pressão Acústica dB e frequência)
    const acousticDb = tel?.acoustic_db ?? (isOperational ? 74.2 : 42.0);
    const acousticPeak = tel?.acoustic_peak_freq ?? (isOperational ? 2400 : 120);

    // Outros metadados
    const powerKw = machine.metadata?.power_kw ?? null;
    const clampingTon = machine.metadata?.clamping_force_ton ?? null;
    const axes = machine.metadata?.axes ?? null;

    // Cálculo da barra ISO 20816 (escala de 0 a 7.1 mm/s)
    const maxVibScale = 7.1;
    const vibProgressPct = Math.min(Math.max((vibRms / maxVibScale) * 100, 2), 100);

    return (
        <View
            style={[
                styles.bezel,
                {
                    width: containerWidth,
                    height: containerHeight,
                },
            ]}
        >
            <View style={styles.lcdScreen}>
                {/* 1. Header Bar Industrial (Top status bar) */}
                <View style={[styles.headerBar, { height: 38 * scaleFactor }]}>
                    <View style={styles.headerLeft}>
                        <View
                            style={[
                                styles.statusBeacon,
                                {
                                    backgroundColor: isOperational ? '#00E676' : '#FF9100',
                                    shadowColor: isOperational ? '#00E676' : '#FF9100',
                                },
                            ]}
                        />
                        <Text
                            numberOfLines={1}
                            style={[styles.headerMachineName, { fontSize: Math.max(13 * scaleFactor, 11) }]}
                        >
                            {machine.name.toUpperCase()}
                        </Text>
                        <View style={styles.codeTag}>
                            <Text style={[styles.codeTagText, { fontSize: Math.max(10 * scaleFactor, 8) }]}>
                                {machine.code || 'MCH-01'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <View style={styles.sensorStatusBadge}>
                            <Ionicons
                                name={hasOnlineNode ? 'hardware-chip' : 'hardware-chip-outline'}
                                size={12 * scaleFactor}
                                color={hasOnlineNode ? '#00E676' : '#757575'}
                            />
                            <Text style={[styles.sensorStatusText, { fontSize: Math.max(10 * scaleFactor, 8) }]}>
                                {nodes.length} SENS
                            </Text>
                        </View>
                        <View style={[styles.modePill, { backgroundColor: isOperational ? '#003314' : '#331a00' }]}>
                            <Text
                                style={[
                                    styles.modePillText,
                                    {
                                        color: isOperational ? '#00E676' : '#FF9100',
                                        fontSize: Math.max(9 * scaleFactor, 8),
                                    },
                                ]}
                            >
                                {isOperational ? 'RUNNING' : 'STOPPED'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. Grid Central (Widgets principais de processo) */}
                <View style={styles.bodyGrid}>
                    {/* Painel Esquerdo: Vibração ISO 20816 & Análise Dinâmica */}
                    <View style={styles.cardColLeft}>
                        <View style={styles.widgetBox}>
                            <View style={styles.widgetTitleRow}>
                                <Text style={[styles.widgetTitle, { fontSize: Math.max(10 * scaleFactor, 8) }]}>
                                    VIBRAÇÃO RMS • ISO 20816
                                </Text>
                                <Text
                                    style={[
                                        styles.zoneBadgeText,
                                        {
                                            color: getSeverityColor(severity),
                                            fontSize: Math.max(10 * scaleFactor, 8),
                                        },
                                    ]}
                                >
                                    ZONA {severity}
                                </Text>
                            </View>

                            {/* Valor Principal Gigante */}
                            <View style={styles.bigValueRow}>
                                <Text
                                    style={[
                                        styles.bigNumericValue,
                                        {
                                            fontSize: Math.max(34 * scaleFactor, 22),
                                            color: getSeverityColor(severity),
                                        },
                                    ]}
                                >
                                    {vibRms.toFixed(2)}
                                </Text>
                                <Text style={[styles.unitText, { fontSize: Math.max(11 * scaleFactor, 9) }]}>
                                    mm/s
                                </Text>
                            </View>

                            {/* Barra Colorida das 4 Zonas ISO 20816 */}
                            <View style={styles.isoBarTrack}>
                                <View style={[styles.isoZoneA, { flex: 1.8 }]} />
                                <View style={[styles.isoZoneB, { flex: 1.0 }]} />
                                <View style={[styles.isoZoneC, { flex: 1.7 }]} />
                                <View style={[styles.isoZoneD, { flex: 2.6 }]} />
                                {/* Ponteiro / Cursor */}
                                <View style={[styles.isoCursor, { left: `${vibProgressPct}%` }]} />
                            </View>

                            <View style={styles.isoScaleLabels}>
                                <Text style={[styles.isoTick, { fontSize: 8 * scaleFactor }]}>0</Text>
                                <Text style={[styles.isoTick, { fontSize: 8 * scaleFactor }]}>1.8 (A/B)</Text>
                                <Text style={[styles.isoTick, { fontSize: 8 * scaleFactor }]}>2.8 (C)</Text>
                                <Text style={[styles.isoTick, { fontSize: 8 * scaleFactor }]}>4.5 (D)</Text>
                                <Text style={[styles.isoTick, { fontSize: 8 * scaleFactor }]}>7.1+</Text>
                            </View>
                        </View>
                    </View>

                    {/* Painel Direito: Tacômetro Real, Sonda Térmica e Microfone Acústico */}
                    <View style={styles.cardColRight}>
                        {/* Widget Superior: Tacômetro Real (RPM) */}
                        <View style={styles.widgetBox}>
                            <View style={styles.widgetTitleRow}>
                                <Text style={[styles.widgetTitle, { fontSize: Math.max(10 * scaleFactor, 8) }]}>
                                    TACÔMETRO • RPM REAL
                                </Text>
                                <Ionicons name="speedometer-outline" size={12 * scaleFactor} color="#00E5FF" />
                            </View>
                            <View style={styles.bigValueRow}>
                                <Text
                                    style={[
                                        styles.bigNumericValue,
                                        { fontSize: Math.max(26 * scaleFactor, 18), color: '#00E5FF' },
                                    ]}
                                >
                                    {Math.round(realRpm)}
                                </Text>
                                <Text style={[styles.unitText, { fontSize: Math.max(10 * scaleFactor, 8) }]}>
                                    RPM {nominalRpm ? `(${nominalRpm} nom)` : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Widget Inferior: Sonda Térmica & Microfone Acústico na Máquina */}
                        <View style={[styles.widgetBox, { marginTop: 6 * scaleFactor }]}>
                            <Text style={[styles.widgetTitle, { fontSize: Math.max(9 * scaleFactor, 8) }]}>
                                SONDA TÉRMICA & ACÚSTICA
                            </Text>
                            <View style={styles.splitRow}>
                                {/* Sonda Térmica na Máquina */}
                                <View style={styles.splitCell}>
                                    <View style={styles.cellIconLabel}>
                                        <Ionicons name="thermometer-outline" size={13 * scaleFactor} color="#FF6D00" />
                                        <Text style={[styles.cellLabel, { fontSize: Math.max(9 * scaleFactor, 7) }]}>SONDA</Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.cellValue,
                                            { fontSize: Math.max(16 * scaleFactor, 12), color: '#FFF' },
                                        ]}
                                    >
                                        {probeTemp !== undefined ? `${probeTemp.toFixed(1)}°C` : '--'}
                                    </Text>
                                </View>
                                <View style={styles.cellDivider} />
                                {/* Microfone Acústico (Ruído da Máquina em dB) */}
                                <View style={styles.splitCell}>
                                    <View style={styles.cellIconLabel}>
                                        <Ionicons name="mic-outline" size={13 * scaleFactor} color="#E040FB" />
                                        <Text style={[styles.cellLabel, { fontSize: Math.max(9 * scaleFactor, 7) }]}>RUÍDO</Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.cellValue,
                                            {
                                                fontSize: Math.max(16 * scaleFactor, 12),
                                                color: acousticDb > 85 ? '#FF1744' : '#E040FB',
                                            },
                                        ]}
                                    >
                                        {`${acousticDb.toFixed(1)} dB`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 3. Rodapé Industrial: ML AI Health & Diagnostic Bar */}
                <View style={[styles.footerBar, { height: 34 * scaleFactor }]}>
                    <View style={styles.footerMlGroup}>
                        <Ionicons
                            name="pulse-outline"
                            size={14 * scaleFactor}
                            color={mlRisk > 0.4 ? '#FF3D00' : '#00E676'}
                        />
                        <Text style={[styles.footerMlText, { fontSize: Math.max(10 * scaleFactor, 8) }]}>
                            ML PREDITIVO:
                        </Text>
                        <Text
                            style={[
                                styles.footerMlScore,
                                {
                                    fontSize: Math.max(10 * scaleFactor, 8),
                                    color: mlRisk > 0.4 ? '#FF3D00' : '#00E676',
                                },
                            ]}
                        >
                            {(mlRisk * 100).toFixed(0)}% RISCO ({mlRisk > 0.4 ? 'ANOMALIA' : 'NORMAL'})
                        </Text>
                    </View>

                    <View style={styles.resolutionBadge}>
                        <Text style={[styles.resolutionText, { fontSize: Math.max(9 * scaleFactor, 7) }]}>
                            3.5" LCD • 480×320
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

function getSeverityColor(sev: ISO20816Severity): string {
    switch (sev) {
        case 'A':
            return '#00E676'; // Verde brilhante
        case 'B':
            return '#FFD600'; // Amarelo
        case 'C':
            return '#FF9100'; // Laranja
        case 'D':
            return '#FF1744'; // Vermelho vivo
        default:
            return '#9E9E9E';
    }
}

const styles = StyleSheet.create({
    bezel: {
        backgroundColor: '#1E1E1E', // Moldura física preta/chassi de hardware
        borderRadius: 14,
        padding: 5,
        borderWidth: 2,
        borderColor: '#333333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
        alignSelf: 'center',
    },
    lcdScreen: {
        flex: 1,
        backgroundColor: '#0A0E14', // Fundo profundo de LCD industrial
        borderRadius: 10,
        overflow: 'hidden',
        paddingHorizontal: 10,
        paddingVertical: 6,
        justifyContent: 'space-between',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#1A2332',
        paddingBottom: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    statusBeacon: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 4,
    },
    headerMachineName: {
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    codeTag: {
        backgroundColor: '#162235',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    codeTagText: {
        color: '#64B5F6',
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sensorStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#111822',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sensorStatusText: {
        color: '#90CAF9',
        fontWeight: '600',
    },
    modePill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    modePillText: {
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bodyGrid: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 6,
        gap: 8,
    },
    cardColLeft: {
        flex: 1.15,
    },
    cardColRight: {
        flex: 1,
    },
    widgetBox: {
        backgroundColor: '#0F1622',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1C293E',
        padding: 8,
        flex: 1,
        justifyContent: 'space-between',
    },
    widgetTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    widgetTitle: {
        color: '#90A4AE',
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    zoneBadgeText: {
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bigValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginVertical: 2,
    },
    bigNumericValue: {
        fontWeight: '900',
        fontFamily: 'monospace',
    },
    unitText: {
        color: '#78909C',
        fontWeight: '600',
    },
    isoBarTrack: {
        height: 10,
        borderRadius: 5,
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
        marginVertical: 4,
        backgroundColor: '#10141D',
    },
    isoZoneA: {
        backgroundColor: '#00E676', // Zona A
    },
    isoZoneB: {
        backgroundColor: '#FFD600', // Zona B
    },
    isoZoneC: {
        backgroundColor: '#FF9100', // Zona C
    },
    isoZoneD: {
        backgroundColor: '#FF1744', // Zona D
    },
    isoCursor: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 4,
        marginLeft: -2,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 5,
    },
    isoScaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    isoTick: {
        color: '#546E7A',
        fontFamily: 'monospace',
    },
    splitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    splitCell: {
        flex: 1,
        alignItems: 'center',
    },
    cellDivider: {
        width: 1,
        height: 26,
        backgroundColor: '#1E2C42',
    },
    cellIconLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 2,
    },
    cellLabel: {
        color: '#78909C',
        fontWeight: '600',
    },
    cellValue: {
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    footerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#1A2332',
        paddingTop: 4,
    },
    footerMlGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    footerMlText: {
        color: '#90A4AE',
        fontWeight: '600',
    },
    footerMlScore: {
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    resolutionBadge: {
        backgroundColor: '#131D2A',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    resolutionText: {
        color: '#546E7A',
        fontFamily: 'monospace',
        fontWeight: '500',
    },
});
