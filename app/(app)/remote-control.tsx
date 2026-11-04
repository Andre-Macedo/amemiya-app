import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useMachines } from '@/hooks/use-machines';
import { machineApi } from '@/services/machine-api';
import { useBLE } from '@/hooks/use-ble';
import { buildNordicUartCommand } from '@/services/ble/drivers/nordic-uart.driver';

type ControlChannel = 'mqtt' | 'ble';
type BuzzerStatus = 'active' | 'silenced' | 'normal';

interface CommandLogItem {
    id: string;
    command: string;
    channel: ControlChannel;
    timestamp: string;
    success: boolean;
    detail?: string;
}

export default function RemoteControlScreen() {
    const { machineId } = useLocalSearchParams<{ machineId?: string }>();
    const router = useRouter();

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textPrimary = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');

    // Seleção de Máquina e Canal
    const { data: machines, isLoading: loadingMachines, refetch: refetchMachines } = useMachines();
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(machineId || null);
    const [channel, setChannel] = useState<ControlChannel>('mqtt');

    // Estado BLE
    const {
        isConnected: isBleConnected,
        connectionStatus: bleStatus,
        device: bleDevice,
        batteryLevel: bleBattery,
        scanAndConnect: connectBle,
        disconnect: disconnectBle,
        sendBleCommand,
    } = useBLE();

    // Estados de Atuação do Buzzer
    const [buzzerStatus, setBuzzerStatus] = useState<BuzzerStatus>('normal');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Histórico de Comandos da Sessão
    const [commandLogs, setCommandLogs] = useState<CommandLogItem[]>([]);

    // Identifica máquina selecionada
    const currentMachine = useMemo(() => {
        if (!machines || machines.length === 0) return null;
        if (selectedMachineId) {
            return machines.find(m => m.id === selectedMachineId) || machines[0];
        }
        return machines[0];
    }, [machines, selectedMachineId]);

    const logCommand = (command: string, success: boolean, detail?: string) => {
        const item: CommandLogItem = {
            id: Math.random().toString(36).substring(2, 9),
            command,
            channel,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            success,
            detail,
        };
        setCommandLogs(prev => [item, ...prev.slice(0, 19)]);
    };

    // 1. Despacho Unificado de Comandos (Nuvem/MQTT ou BLE)
    const executeCommand = async (
        command: 'silence_buzzer' | 'reset_alarm' | 'test_buzzer' | 'emergency_stop',
        reason?: string
    ) => {
        if (channel === 'ble') {
            if (!isBleConnected) {
                Alert.alert('Bancada Desconectada', 'Conecte-se via Bluetooth à bancada antes de enviar comandos diretos.');
                return;
            }

            setIsSubmitting(true);
            try {
                const uartPayload = buildNordicUartCommand(command, { reason });
                const ok = await sendBleCommand(uartPayload);
                if (ok) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    logCommand(command, true, `BLE UART: ${uartPayload.trim()}`);

                    if (command === 'silence_buzzer') {
                        setBuzzerStatus('silenced');
                    } else if (command === 'reset_alarm') {
                        setBuzzerStatus('normal');
                    }
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
                    logCommand(command, false, 'Falha de transmissão BLE');
                    Alert.alert('Erro BLE', 'Não foi possível transmitir o comando para o nó ESP32.');
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Erro BLE desconhecido';
                logCommand(command, false, errMsg);
                Alert.alert('Erro BLE', errMsg);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Modo Nuvem / MQTT
        if (!currentMachine) {
            Alert.alert('Atenção', 'Selecione uma máquina para comandar.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await machineApi.sendCommand(currentMachine.id, {
                command,
                reason: reason || `Comando ${command} disparado via app mobile`,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            logCommand(command, true, `MQTT ACK: ${res.command_id.substring(0, 8)}...`);

            if (command === 'silence_buzzer') {
                setBuzzerStatus('silenced');
            } else if (command === 'reset_alarm') {
                setBuzzerStatus('normal');
            }

            refetchMachines();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Falha na requisição';
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            logCommand(command, false, errMsg);
            Alert.alert('Erro no Comando', `Falha ao enviar comando para a máquina: ${errMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.screen, { backgroundColor: bg }]}>
            <ScreenHeader
                title="Silenciador de Alarme"
                showBack
                rightIcon="tv-outline"
                rightColor="#00A86B"
                rightAction={() => {
                    if (currentMachine) {
                        router.push(`/machines/${currentMachine.id}/hmi` as any);
                    }
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 1. CALLOUT DE SEGURANÇA E NR-12 */}
                <View style={[styles.safetyCallout, { borderColor: border }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#1A365D" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.safetyTitle, { color: textPrimary }]}>
                            Operação sem CLP — Segurança Física NR-12
                        </Text>
                        <Text style={[styles.safetyText, { color: textSec }]}>
                            A partida e a parada do motor da Bancada M1 são realizadas exclusivamente através das botoeiras físicas locais no painel elétrico. Este aplicativo atua no reconhecimento (ACK), teste e silenciamento do alarme sonoro (buzzer) do nó sensor ESP32.
                        </Text>
                    </View>
                </View>

                {/* 2. CARD DO STATUS DO ALARME SONORO */}
                <View
                    style={[
                        styles.alarmStatusCard,
                        buzzerStatus === 'active'
                            ? styles.alarmActiveBg
                            : buzzerStatus === 'silenced'
                            ? styles.alarmSilencedBg
                            : styles.alarmNormalBg,
                    ]}
                >
                    <View style={styles.alarmStatusHeader}>
                        <Ionicons
                            name={
                                buzzerStatus === 'active'
                                    ? 'volume-high'
                                    : buzzerStatus === 'silenced'
                                    ? 'volume-mute'
                                    : 'volume-low-outline'
                            }
                            size={32}
                            color={
                                buzzerStatus === 'active'
                                    ? '#E53E3E'
                                    : buzzerStatus === 'silenced'
                                    ? '#DD6B20'
                                    : '#00A86B'
                            }
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text
                                style={[
                                    styles.alarmStatusTitle,
                                    {
                                        color:
                                            buzzerStatus === 'active'
                                                ? '#E53E3E'
                                                : buzzerStatus === 'silenced'
                                                ? '#DD6B20'
                                                : '#00A86B',
                                    },
                                ]}
                            >
                                {buzzerStatus === 'active'
                                    ? 'ALARME SONORO ATIVO'
                                    : buzzerStatus === 'silenced'
                                    ? 'BUZZER SILENCIADO (EM ANÁLISE)'
                                    : 'BUZZER EM MODO NORMAL (SILENCIOSO)'}
                            </Text>
                            <Text style={styles.alarmStatusSubtitle}>
                                {buzzerStatus === 'active'
                                    ? 'Anomalia detectada. Toque abaixo para silenciar o buzzer.'
                                    : buzzerStatus === 'silenced'
                                    ? 'Buzzer mutado pelo operador. Falha física aguardando reset.'
                                    : 'Nenhuma anomalia crítica. Sinalizador sonoro desativado.'}
                            </Text>
                        </View>
                    </View>

                    {/* Botão de Silenciar Buzzer Gigante em Destaque */}
                    <Pressable
                        style={[
                            styles.silenceBuzzerBtn,
                            buzzerStatus === 'active' ? styles.silenceBtnDanger : styles.silenceBtnNeutral,
                        ]}
                        onPress={() => executeCommand('silence_buzzer', 'Silenciamento manual do buzzer pelo operador')}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="volume-mute" size={26} color="#FFFFFF" />
                                <Text style={styles.silenceBuzzerBtnText}>
                                    SILENCIAR BUZZER AGORA
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>

                {/* 3. AÇÕES DE ALARME E TESTE */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>Ações de Alarme & Diagnóstico</Text>

                    <View style={styles.actionRow}>
                        {/* Resetar Alarme */}
                        <Pressable
                            style={[styles.secondaryActionBtn, { borderColor: '#1A365D' }]}
                            onPress={() => executeCommand('reset_alarm', 'Reset de alarme confirmado pelo operador')}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="refresh-circle-outline" size={22} color="#1A365D" />
                            <Text style={[styles.secondaryActionBtnText, { color: '#1A365D' }]}>
                                Resetar Alarme
                            </Text>
                        </Pressable>

                        {/* Testar Buzzer (Bip curto de 1s) */}
                        <Pressable
                            style={[styles.secondaryActionBtn, { borderColor: '#00A86B' }]}
                            onPress={() => executeCommand('test_buzzer', 'Bip de teste sonoro de 1 segundo')}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="musical-notes-outline" size={22} color="#00A86B" />
                            <Text style={[styles.secondaryActionBtnText, { color: '#00A86B' }]}>
                                Testar Buzzer (1s)
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* 4. SELETOR DE PROTOCOLO / CANAL */}
                <View style={[styles.channelCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>Canal de Envio do Sinal</Text>
                    <View style={styles.channelRow}>
                        <Pressable
                            style={[
                                styles.channelBtn,
                                channel === 'mqtt' && styles.channelBtnActive,
                                { borderColor: channel === 'mqtt' ? '#1A365D' : border },
                            ]}
                            onPress={() => setChannel('mqtt')}
                        >
                            <Ionicons
                                name="cloud-done-outline"
                                size={18}
                                color={channel === 'mqtt' ? '#FFFFFF' : textSec}
                            />
                            <Text
                                style={[
                                    styles.channelText,
                                    { color: channel === 'mqtt' ? '#FFFFFF' : textPrimary },
                                ]}
                            >
                                Nuvem / MQTT
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.channelBtn,
                                channel === 'ble' && styles.channelBtnActiveBle,
                                { borderColor: channel === 'ble' ? '#00A86B' : border },
                            ]}
                            onPress={() => setChannel('ble')}
                        >
                            <Ionicons
                                name="bluetooth-outline"
                                size={18}
                                color={channel === 'ble' ? '#FFFFFF' : textSec}
                            />
                            <Text
                                style={[
                                    styles.channelText,
                                    { color: channel === 'ble' ? '#FFFFFF' : textPrimary },
                                ]}
                            >
                                BLE Direto (ESP32)
                            </Text>
                        </Pressable>
                    </View>

                    {/* Status do Canal BLE quando ativo */}
                    {channel === 'ble' && (
                        <View style={styles.bleStatusContainer}>
                            <View style={styles.bleStatusRow}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        { backgroundColor: isBleConnected ? '#00E676' : '#FF9100' },
                                    ]}
                                />
                                <Text style={[styles.bleStatusLabel, { color: textPrimary }]}>
                                    {isBleConnected ? `Conectado: ${bleDevice?.name || 'ESP32 Bancada'}` : `BLE: ${bleStatus}`}
                                </Text>
                                {bleBattery !== null && (
                                    <View style={styles.batteryBadge}>
                                        <Ionicons name="battery-charging-outline" size={14} color="#00E676" />
                                        <Text style={styles.batteryText}>{bleBattery}%</Text>
                                    </View>
                                )}
                            </View>

                            <Pressable
                                style={[
                                    styles.bleActionBtn,
                                    { backgroundColor: isBleConnected ? '#E53E3E22' : '#00A86B22' },
                                ]}
                                onPress={isBleConnected ? disconnectBle : connectBle}
                            >
                                <Ionicons
                                    name={isBleConnected ? 'close-circle-outline' : 'refresh-outline'}
                                    size={16}
                                    color={isBleConnected ? '#E53E3E' : '#00A86B'}
                                />
                                <Text style={{ color: isBleConnected ? '#E53E3E' : '#00A86B', fontFamily: Fonts.sansSemiBold, fontSize: 13, marginLeft: 6 }}>
                                    {isBleConnected ? 'Desconectar' : 'Escanear ESP32'}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* 5. SELETOR DE MÁQUINA */}
                {loadingMachines ? (
                    <ActivityIndicator size="small" color="#1A365D" style={{ marginVertical: 10 }} />
                ) : machines && machines.length > 0 ? (
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                        <View style={styles.machineHeader}>
                            <View>
                                <Text style={[styles.machineTitle, { color: textPrimary }]}>
                                    {currentMachine?.name || 'Bancada M1'}
                                </Text>
                                <Text style={[styles.machineSubtitle, { color: textSec }]}>
                                    {currentMachine?.code} • {currentMachine?.station?.name || 'Posto de Medição'}
                                </Text>
                            </View>
                            <View style={styles.statusPill}>
                                <Text style={styles.statusPillText}>
                                    {currentMachine?.status?.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {machines.length > 1 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.machineChipsScroll}>
                                {machines.map(m => (
                                    <Pressable
                                        key={m.id}
                                        style={[
                                            styles.machineChip,
                                            selectedMachineId === m.id && styles.machineChipActive,
                                            { borderColor: selectedMachineId === m.id ? '#1A365D' : border },
                                        ]}
                                        onPress={() => setSelectedMachineId(m.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.machineChipText,
                                                { color: selectedMachineId === m.id ? '#FFFFFF' : textPrimary },
                                            ]}
                                        >
                                            {m.code || m.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : null}

                {/* 6. LOG DE AUDITORIA DA SESSÃO (ISO 17025) */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, marginBottom: 30 }]}>
                    <View style={styles.logHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="receipt-outline" size={18} color="#1A365D" />
                            <Text style={[styles.sectionTitle, { color: textPrimary, marginLeft: 6 }]}>
                                Histórico de Reconhecimento (ACK)
                            </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: textSec }}>ISO 17025</Text>
                    </View>

                    {commandLogs.length === 0 ? (
                        <Text style={[styles.emptyLogText, { color: textSec }]}>
                            Nenhuma ação registrada nesta sessão de silenciamento.
                        </Text>
                    ) : (
                        commandLogs.map(item => (
                            <View key={item.id} style={[styles.logItem, { borderColor: border }]}>
                                <View style={styles.logItemLeft}>
                                    <Ionicons
                                        name={item.success ? 'checkmark-circle' : 'close-circle'}
                                        size={18}
                                        color={item.success ? '#00A86B' : '#E53E3E'}
                                    />
                                    <View style={{ marginLeft: 8 }}>
                                        <Text style={[styles.logCommandName, { color: textPrimary }]}>
                                            {item.command === 'silence_buzzer'
                                                ? 'BUZZER SILENCIADO'
                                                : item.command === 'reset_alarm'
                                                ? 'ALARME RESETADO'
                                                : item.command === 'test_buzzer'
                                                ? 'TESTE SONORO'
                                                : item.command.toUpperCase()}
                                        </Text>
                                        {item.detail ? (
                                            <Text style={[styles.logDetail, { color: textSec }]} numberOfLines={1}>
                                                {item.detail}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.logTime, { color: textSec }]}>{item.timestamp}</Text>
                                    <View style={styles.logChannelPill}>
                                        <Text style={styles.logChannelText}>{item.channel.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    safetyCallout: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#EDF2F7',
        marginBottom: 14,
        alignItems: 'flex-start',
    },
    safetyTitle: {
        fontSize: 13,
        fontFamily: Fonts.sansBold,
        marginBottom: 2,
    },
    safetyText: {
        fontSize: 11,
        fontFamily: Fonts.sans,
        lineHeight: 16,
    },
    alarmStatusCard: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 14,
    },
    alarmActiveBg: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FEB2B2',
    },
    alarmSilencedBg: {
        backgroundColor: '#FFFAF0',
        borderColor: '#FBD38D',
    },
    alarmNormalBg: {
        backgroundColor: '#F0FFF4',
        borderColor: '#9AE6B4',
    },
    alarmStatusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    alarmStatusTitle: {
        fontSize: 15,
        fontFamily: Fonts.sansBold,
        letterSpacing: 0.5,
    },
    alarmStatusSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.sans,
        color: '#718096',
        marginTop: 2,
    },
    silenceBuzzerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
    },
    silenceBtnDanger: {
        backgroundColor: '#E53E3E',
        shadowColor: '#E53E3E',
    },
    silenceBtnNeutral: {
        backgroundColor: '#DD6B20',
        shadowColor: '#DD6B20',
    },
    silenceBuzzerBtnText: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 15,
        marginLeft: 10,
        letterSpacing: 0.5,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    secondaryActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    secondaryActionBtnText: {
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
        marginLeft: 6,
    },
    channelCard: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: Fonts.sansSemiBold,
        marginBottom: 10,
    },
    channelRow: {
        flexDirection: 'row',
        gap: 10,
    },
    channelBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    channelBtnActive: {
        backgroundColor: '#1A365D',
    },
    channelBtnActiveBle: {
        backgroundColor: '#00A86B',
    },
    channelText: {
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
        marginLeft: 6,
    },
    bleStatusContainer: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bleStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    bleStatusLabel: {
        fontSize: 12,
        fontFamily: Fonts.sans,
    },
    batteryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        backgroundColor: '#00E67615',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    batteryText: {
        fontSize: 11,
        color: '#00A86B',
        marginLeft: 2,
        fontFamily: Fonts.sansSemiBold,
    },
    bleActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    card: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 14,
    },
    machineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    machineTitle: {
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
    },
    machineSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.sans,
        marginTop: 2,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: '#E2E8F0',
    },
    statusPillText: {
        fontSize: 10,
        fontFamily: Fonts.sansBold,
        color: '#4A5568',
        letterSpacing: 0.5,
    },
    machineChipsScroll: {
        marginTop: 12,
        paddingTop: 8,
    },
    machineChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    machineChipActive: {
        backgroundColor: '#1A365D',
    },
    machineChipText: {
        fontSize: 12,
        fontFamily: Fonts.sansSemiBold,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyLogText: {
        fontSize: 12,
        textAlign: 'center',
        paddingVertical: 12,
    },
    logItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    logItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logCommandName: {
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
    },
    logDetail: {
        fontSize: 11,
        fontFamily: Fonts.sans,
        maxWidth: 200,
    },
    logTime: {
        fontSize: 11,
        fontFamily: Fonts.sans,
    },
    logChannelPill: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        marginTop: 2,
    },
    logChannelText: {
        fontSize: 9,
        fontFamily: Fonts.sansBold,
        color: '#4A5568',
    },
});
