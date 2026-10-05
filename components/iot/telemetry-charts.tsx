import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IoTHistoryPoint } from '@/types/entities';

interface TelemetryChartsProps {
    history: IoTHistoryPoint[];
}

const screenWidth = Dimensions.get('window').width;

export function TelemetryCharts({ history }: TelemetryChartsProps) {
    const [selectedMetric, setSelectedMetric] = useState<'temp' | 'vibration' | 'ml'>('temp');

    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const formatTimeLabel = (pt: any, idx: number) => {
        if (idx % 4 !== 0) return '';
        const raw = pt?.timestamp || pt?.measured_at || pt?.created_at;
        if (!raw || typeof raw !== 'string') return '';
        if (raw.includes('T')) {
            return raw.split('T')[1]?.substring(0, 5) ?? '';
        }
        if (raw.includes(' ')) {
            return raw.split(' ')[1]?.substring(0, 5) ?? '';
        }
        return '';
    };

    // Prepara dados para o gráfico de Temperatura & Umidade
    const tempData = history.map((pt: any, idx) => {
        const val = Number(pt.temperature ?? pt.features?.temperature ?? 20);
        return {
            value: isNaN(val) ? 20 : val,
            label: formatTimeLabel(pt, idx),
            dataPointText: `${isNaN(val) ? 20 : val}`,
        };
    });

    const vibrationData = history.map((pt: any, idx) => {
        const val = Number(pt.vibration_rms ?? pt.rms_global ?? 0);
        return {
            value: isNaN(val) ? 0 : val,
            label: formatTimeLabel(pt, idx),
        };
    });

    const mlData = history.map((pt: any, idx) => {
        let score = 5;
        if (typeof pt.ml_anomaly_score === 'number') {
            score = pt.ml_anomaly_score * 100;
        } else if (pt.ml_status === 'anomaly') {
            score = 85;
        } else if (typeof pt.ml_confidence === 'number') {
            score = (1 - pt.ml_confidence) * 100;
        }
        return {
            value: isNaN(score) ? 5 : Math.round(score),
            label: formatTimeLabel(pt, idx),
        };
    });

    // Dados triaxiais (X, Y, Z) para o BarChart agrupado
    const triaxialData = history.slice(-6).flatMap((pt: any) => [
        { value: Number(pt.accel_x ?? pt.rms_x ?? 0.5), spacing: 2, label: 'X', frontColor: '#007AFF' },
        { value: Number(pt.accel_y ?? pt.rms_y ?? 0.8), spacing: 2, label: 'Y', frontColor: '#34C759' },
        { value: Number(pt.accel_z ?? pt.rms_z ?? 0.3), spacing: 16, label: 'Z', frontColor: '#FF9500' },
    ]);

    return (
        <View style={[styles.container, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Seletor de Métrica */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, selectedMetric === 'temp' && { borderBottomColor: primary, borderBottomWidth: 2 }]}
                    onPress={() => setSelectedMetric('temp')}
                >
                    <Text style={[styles.tabText, { color: selectedMetric === 'temp' ? primary : textSec }]}>
                        Temperatura
                    </Text>
                </Pressable>

                <Pressable
                    style={[styles.tab, selectedMetric === 'vibration' && { borderBottomColor: primary, borderBottomWidth: 2 }]}
                    onPress={() => setSelectedMetric('vibration')}
                >
                    <Text style={[styles.tabText, { color: selectedMetric === 'vibration' ? primary : textSec }]}>
                        Vibração (ISO)
                    </Text>
                </Pressable>

                <Pressable
                    style={[styles.tab, selectedMetric === 'ml' && { borderBottomColor: primary, borderBottomWidth: 2 }]}
                    onPress={() => setSelectedMetric('ml')}
                >
                    <Text style={[styles.tabText, { color: selectedMetric === 'ml' ? primary : textSec }]}>
                        Risco ML (%)
                    </Text>
                </Pressable>
            </View>

            {/* Gráfico Selecionado */}
            <View style={styles.chartWrapper}>
                {selectedMetric === 'temp' && (
                    <View>
                        <Text style={[styles.chartTitle, { color: textSec }]}>Série Temporal de Temperatura (°C)</Text>
                        {tempData.length > 0 ? (
                            <LineChart
                                data={tempData}
                                width={screenWidth - 80}
                                height={200}
                                color="#007AFF"
                                thickness={3}
                                startFillColor="#007AFF33"
                                endFillColor="#007AFF05"
                                startOpacity={0.9}
                                endOpacity={0.2}
                                areaChart
                                curved
                                isAnimated
                                hideDataPoints={tempData.length > 15}
                                noOfSections={4}
                                yAxisTextStyle={{ color: textSec, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: textSec, fontSize: 10 }}
                            />
                        ) : (
                            <Text style={[styles.emptyText, { color: textSec }]}>Sem dados no período.</Text>
                        )}
                    </View>
                )}

                {selectedMetric === 'vibration' && (
                    <View>
                        <Text style={[styles.chartTitle, { color: textSec }]}>Velocidade de Vibração RMS (mm/s) e Triaxial</Text>
                        {vibrationData.length > 0 ? (
                            <LineChart
                                data={vibrationData}
                                width={screenWidth - 80}
                                height={180}
                                color="#FF9500"
                                thickness={3}
                                curved
                                isAnimated
                                noOfSections={4}
                                yAxisTextStyle={{ color: textSec, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: textSec, fontSize: 10 }}
                            />
                        ) : (
                            <Text style={[styles.emptyText, { color: textSec }]}>Sem dados de vibração.</Text>
                        )}

                        {triaxialData.length > 0 && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.chartSubtitle, { color: textSec }]}>Últimas Amostras Triaxiais (X / Y / Z)</Text>
                                <BarChart
                                    data={triaxialData}
                                    width={screenWidth - 80}
                                    height={140}
                                    barWidth={10}
                                    isAnimated
                                    noOfSections={3}
                                    yAxisTextStyle={{ color: textSec, fontSize: 10 }}
                                    xAxisLabelTextStyle={{ color: textSec, fontSize: 9 }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {selectedMetric === 'ml' && (
                    <View>
                        <Text style={[styles.chartTitle, { color: textSec }]}>Probabilidade de Anomalia do Modelo IA (%)</Text>
                        {mlData.length > 0 ? (
                            <LineChart
                                data={mlData}
                                width={screenWidth - 80}
                                height={200}
                                color="#FF3B30"
                                thickness={3}
                                areaChart
                                startFillColor="#FF3B3033"
                                endFillColor="#FF3B3005"
                                curved
                                isAnimated
                                maxValue={100}
                                noOfSections={4}
                                yAxisTextStyle={{ color: textSec, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: textSec, fontSize: 10 }}
                            />
                        ) : (
                            <Text style={[styles.emptyText, { color: textSec }]}>Sem predições no período.</Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#0000000a',
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    tabText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    chartWrapper: {
        paddingVertical: 8,
    },
    chartTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        marginBottom: 12,
    },
    chartSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        textAlign: 'center',
        marginVertical: 40,
    },
});
