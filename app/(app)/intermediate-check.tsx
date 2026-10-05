import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useBLE } from '@/hooks/use-ble';
import { api } from '@/services/api';
import { LineChart } from 'react-native-gifted-charts';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface ShewhartPoint {
    id: string;
    check_date: string;
    mean_value: number;
    nominal_value: number;
    deviation: number;
}

interface ShewhartData {
    nominal: number;
    ucl: number;
    lcl: number;
    cl: number;
    history: ShewhartPoint[];
}

export default function IntermediateCheckScreen() {
    const router = useRouter();

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const { scanAndConnect, isConnected, lastValue } = useBLE();

    const [instrumentId, setInstrumentId] = useState('');
    const [nominalValue, setNominalValue] = useState('25.000');
    const [readings, setReadings] = useState<string[]>(['', '', '']);
    const [activeIdx, setActiveIdx] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [shewhartData, setShewhartData] = useState<ShewhartData | null>(null);

    // Conecta ao BLE automaticamente
    useEffect(() => {
        if (!isConnected) {
            scanAndConnect();
        }
    }, [isConnected]);

    // Quando o pedal aciona, preenche o campo atual e avança para o próximo!
    useEffect(() => {
        if (lastValue) {
            setReadings(prev => {
                const next = [...prev];
                next[activeIdx] = lastValue;
                return next;
            });
            // Auto-avança o foco para a próxima repetição
            if (activeIdx < 2) {
                setActiveIdx(activeIdx + 1);
            }
        }
    }, [lastValue]);

    const handleSaveCheck = async () => {
        const nums = readings.map(r => parseFloat(r)).filter(r => !isNaN(r));
        if (nums.length === 0) {
            Alert.alert('Atenção', 'Insira as medições da checagem.');
            return;
        }

        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const nominal = parseFloat(nominalValue) || 25;
        const deviation = mean - nominal;

        setLoading(true);
        try {
            await api.post('/intermediate-checks', {
                instrument_id: instrumentId || undefined,
                nominal_value: nominal,
                readings: nums,
                mean_value: mean,
                deviation: deviation,
                check_date: new Date().toISOString(),
            });

            Alert.alert(
                'Checagem Concluída',
                `Média: ${mean.toFixed(4)} mm\nDesvio: ${deviation > 0 ? '+' : ''}${deviation.toFixed(4)} mm\nInstrumento liberado para uso!`
            );
            router.back();
        } catch {
            Alert.alert('Erro', 'Não foi possível registrar a checagem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Checagem Intermediária" showBack />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Banner de Status do Hardware BLE */}
                <View style={[styles.bleBanner, { backgroundColor: isConnected ? '#34C75915' : '#FF950015' }]}>
                    <Ionicons
                        name={isConnected ? 'bluetooth' : 'bluetooth-outline'}
                        size={18}
                        color={isConnected ? '#34C759' : '#FF9500'}
                    />
                    <Text style={[styles.bleText, { color: isConnected ? '#34C759' : '#FF9500' }]}>
                        {isConnected ? 'Hardware BLE Conectado (Pronto para o Pedal)' : 'Conectando ao Hardware BLE...'}
                    </Text>
                </View>

                {/* Formulário de Checagem Rápida */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.cardTitle, { color: text }]}>Medição de Padrão Fixo</Text>
                    <Text style={[styles.cardSubtitle, { color: textSec }]}>
                        Meça o bloco de verificação 3 vezes. Ao pisar no pedal, o campo avança sozinho!
                    </Text>

                    <Text style={[styles.label, { color: textSec }]}>Valor Nominal do Bloco (mm):</Text>
                    <TextInput
                        style={[styles.input, { color: text, borderColor: border }]}
                        value={nominalValue}
                        onChangeText={setNominalValue}
                        keyboardType="numeric"
                    />

                    <Text style={[styles.label, { color: textSec, marginTop: 14 }]}>3 Leituras Rápidas:</Text>
                    <View style={styles.readingsRow}>
                        {readings.map((val, idx) => (
                            <Pressable
                                key={idx}
                                style={[
                                    styles.readingBox,
                                    {
                                        backgroundColor: activeIdx === idx ? primary + '15' : border + '20',
                                        borderColor: activeIdx === idx ? primary : border,
                                    },
                                ]}
                                onPress={() => setActiveIdx(idx)}
                            >
                                <Text style={[styles.readingIndex, { color: textSec }]}>#{idx + 1}</Text>
                                <TextInput
                                    style={[styles.readingInput, { color: text }]}
                                    value={val}
                                    placeholder="0.00"
                                    placeholderTextColor={textSec}
                                    keyboardType="numeric"
                                    onFocus={() => setActiveIdx(idx)}
                                    onChangeText={txt => {
                                        const next = [...readings];
                                        next[idx] = txt;
                                        setReadings(next);
                                    }}
                                />
                            </Pressable>
                        ))}
                    </View>

                    <Pressable
                        style={[styles.saveBtn, { backgroundColor: primary }]}
                        onPress={handleSaveCheck}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Liberar Instrumento</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    bleBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    bleText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    card: {
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        elevation: 2,
    },
    cardTitle: {
        fontFamily: Fonts.sansBold,
        fontSize: 16,
    },
    cardSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
        marginBottom: 14,
    },
    label: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginBottom: 4,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    readingsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    readingBox: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1.5,
        padding: 10,
        alignItems: 'center',
    },
    readingIndex: {
        fontFamily: Fonts.sans,
        fontSize: 11,
        marginBottom: 4,
    },
    readingInput: {
        fontFamily: Fonts.sansBold,
        fontSize: 16,
        textAlign: 'center',
        width: '100%',
    },
    saveBtn: {
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
    },
});
