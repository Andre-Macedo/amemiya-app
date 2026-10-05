import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IoTNode, ISO20816Severity } from '@/types/entities';

interface SensorIhmCardProps {
    node: IoTNode;
    onPress?: () => void;
}

export function getIso20816Color(severity?: ISO20816Severity): { bg: string; text: string; label: string } {
    switch (severity) {
        case 'A':
            return { bg: '#34C75922', text: '#34C759', label: 'Zona A (Excelente)' };
        case 'B':
            return { bg: '#FFCC0022', text: '#FF9500', label: 'Zona B (Bom / Aceitável)' };
        case 'C':
            return { bg: '#FF950022', text: '#FF9500', label: 'Zona C (Alerta Operacional)' };
        case 'D':
            return { bg: '#FF3B3022', text: '#FF3B30', label: 'Zona D (Perigo / Crítico)' };
        default:
            return { bg: '#8E8E9322', text: '#8E8E93', label: 'Indeterminado' };
    }
}

export function SensorIhmCard({ node, onPress }: SensorIhmCardProps) {
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');
    const primary = useThemeColor({}, 'primary');

    const tel = node.latest_telemetry;
    const isoInfo = getIso20816Color(tel?.iso20816_severity);
    const isOnline = node.status === 'online';

    return (
        <Pressable
            style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
            onPress={onPress}
        >
            {/* Header: Nome do Sensor e Status de Conexão */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.statusDot, { backgroundColor: isOnline ? '#34C759' : '#8E8E93' }]} />
                    <Text style={[styles.name, { color: text }]}>{node.name}</Text>
                </View>
                <View style={styles.metricsBadge}>
                    <Ionicons name="battery-charging-outline" size={14} color={textSec} />
                    <Text style={[styles.badgeText, { color: textSec }]}>{node.battery_level ?? 100}%</Text>
                    {node.rssi !== undefined && (
                        <>
                            <Ionicons name="cellular-outline" size={14} color={textSec} style={{ marginLeft: 6 }} />
                            <Text style={[styles.badgeText, { color: textSec }]}>{node.rssi} dBm</Text>
                        </>
                    )}
                </View>
            </View>

            {/* Grid de Leituras Ambientais e Mecânicas */}
            <View style={styles.grid}>
                <View style={[styles.cell, { backgroundColor: border + '33' }]}>
                    <Text style={[styles.cellLabel, { color: textSec }]}>Temperatura</Text>
                    <Text style={[styles.cellValue, { color: text }]}>
                        {tel?.temperature !== undefined ? `${tel.temperature.toFixed(1)} °C` : '--'}
                    </Text>
                </View>

                <View style={[styles.cell, { backgroundColor: border + '33' }]}>
                    <Text style={[styles.cellLabel, { color: textSec }]}>Umidade</Text>
                    <Text style={[styles.cellValue, { color: text }]}>
                        {tel?.humidity !== undefined ? `${tel.humidity.toFixed(1)} %` : '--'}
                    </Text>
                </View>

                <View style={[styles.cell, { backgroundColor: border + '33' }]}>
                    <Text style={[styles.cellLabel, { color: textSec }]}>Vibração RMS</Text>
                    <Text style={[styles.cellValue, { color: text }]}>
                        {tel?.vibration_rms !== undefined ? `${tel.vibration_rms.toFixed(2)} mm/s` : '--'}
                    </Text>
                </View>
            </View>

            {/* Barra de Severidade ISO 20816 e ML */}
            <View style={styles.footer}>
                <View style={[styles.isoBadge, { backgroundColor: isoInfo.bg }]}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={isoInfo.text} />
                    <Text style={[styles.isoText, { color: isoInfo.text }]}>ISO 20816: {isoInfo.label}</Text>
                </View>

                {tel?.ml_anomaly_probability !== undefined && (
                    <Text style={[styles.mlText, { color: tel.ml_anomaly_probability > 0.5 ? '#FF3B30' : '#34C759' }]}>
                        ML Risco: {(tel.ml_anomaly_probability * 100).toFixed(0)}%
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    name: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    metricsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginLeft: 3,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 12,
    },
    cell: {
        flex: 1,
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
    },
    cellLabel: {
        fontFamily: Fonts.sans,
        fontSize: 11,
        marginBottom: 4,
    },
    cellValue: {
        fontFamily: Fonts.sansBold,
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#0000000a',
    },
    isoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    isoText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
    },
    mlText: {
        fontFamily: Fonts.sansBold,
        fontSize: 12,
    },
});
