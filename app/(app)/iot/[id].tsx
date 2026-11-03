import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useIoTNodeDetails, useIoTNodeHistory } from '@/hooks/use-iot';
import { SensorIhmCard } from '@/components/iot/sensor-ihm-card';
import { TelemetryCharts } from '@/components/iot/telemetry-charts';

export default function IoTNodeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [period, setPeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

    const bg = useThemeColor({}, 'background');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const cardBg = useThemeColor({}, 'white');

    const { data: node, isLoading: loadingNode } = useIoTNodeDetails(id);
    const { data: history = [], isLoading: loadingHistory } = useIoTNodeHistory(id, period);

    if (loadingNode) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    if (!node) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ScreenHeader title="Sensor IoT" showBack />
                <Text style={{ color: textSec, marginTop: 20 }}>Sensor não encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={node.name} showBack />

            <ScrollView contentContainerStyle={styles.container}>
                {/* IHM do Sensor em Destaque */}
                <SensorIhmCard node={node} />

                {/* Seletor de Período Temporal */}
                <View style={styles.periodRow}>
                    {(['1h', '6h', '24h', '7d'] as const).map(p => (
                        <Pressable
                            key={p}
                            style={[
                                styles.periodBtn,
                                { backgroundColor: period === p ? primary : cardBg },
                            ]}
                            onPress={() => setPeriod(p)}
                        >
                            <Text style={[styles.periodText, { color: period === p ? '#fff' : textSec }]}>
                                {p.toUpperCase()}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Gráficos Interativos */}
                {loadingHistory ? (
                    <ActivityIndicator style={{ marginVertical: 30 }} color={primary} />
                ) : (
                    <TelemetryCharts history={history} />
                )}
            </ScrollView>
        </View>
    );
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
    periodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 1,
    },
    periodText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
});
