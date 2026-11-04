import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    TextInput,
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

    // Estado de Seleção de Máquina e Canal
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

    // Estados de Atuação
    const [targetRpm, setTargetRpm] = useState<number>(1750);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [relay1, setRelay1] = useState<boolean>(false);
    const [relay2, setRelay2] = useState<boolean>(false);

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
        command: 'start' | 'stop' | 'emergency_stop' | 'set_rpm' | 'toggle_relay' | 'reset_alarm',
        options?: { rpm?: number; relay_index?: number; relay_state?: boolean; reason?: string }
    ) => {
        if (channel === 'ble') {
            if (!isBleConnected) {
                Alert.alert('Bancada Desconectada', 'Conecte-se via Bluetooth à bancada antes de enviar comandos diretos.');
                return;
            }

            setIsSubmitting(true);
            try {
                const uartPayload = buildNordicUartCommand(command, options);
                const ok = await sendBleCommand(uartPayload);
                if (ok) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    logCommand(command, true, `BLE UART: ${uartPayload.trim()}`);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
                    logCommand(command, false, 'Falha de transmissão BLE');
                    Alert.alert('Erro BLE', 'Não foi possível enviar o comando para o microcontrolador.');
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
                rpm: options?.rpm,
                relay_index: options?.relay_index,
                relay_state: options?.relay_state,
                reason: options?.reason || `Acionamento via Controle Remoto App (${channel.toUpperCase()})`,
            });

            Haptics.notificationAsync(
                command === 'emergency_stop'
                    ? Haptics.NotificationFeedbackType.Error
                    : Haptics.NotificationFeedbackType.Success
            ).catch(() => {});

            logCommand(command, true, `MQTT: ${res.command_id.substring(0, 8)}... (${res.machine_status})`);
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

    // 2. Parada de Emergência com Confirmação e Segurança NR-12
    const handleEmergencyStop = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        Alert.alert(
            'PARADA DE EMERGÊNCIA (E-STOP)',
            `Confirma o desligamento imediato de todos os acionamentos de potência da máquina ${currentMachine?.name || 'selecionada'}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'ACIONAR E-STOP',
                    style: 'destructive',
                    onPress: () => {
                        executeCommand('emergency_stop', { reason: 'E-STOP acionado pelo operador no aplicativo móvel' });
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // 3. Ajuste de Rotação
    const handleApplyRpm = () => {
        if (targetRpm < 0 || targetRpm > 10000) {
            Alert.alert('RPM Inválido', 'A velocidade deve estar entre 0 e 10.000 RPM.');
            return;
        }
        executeCommand('set_rpm', { rpm: targetRpm });
    };

    // 4. Toggle de Relés Auxiliares
    const handleToggleRelay = (relayIndex: 1 | 2) => {
        const nextState = relayIndex === 1 ? !relay1 : !relay2;
        if (relayIndex === 1) setRelay1(nextState);
        else setRelay2(nextState);

        executeCommand('toggle_relay', {
            relay_index: relayIndex,
            relay_state: nextState,
        });
    };

    return (
        <View style={[styles.screen, { backgroundColor: bg }]}>
            <ScreenHeader
                title="Controle Remoto"
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
                {/* 1. SELETOR DE PROTOCOLO / CANAL */}
                <View style={[styles.channelCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>Canal de Comunicação</Text>
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
                                Local BLE Direto
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
                                    {isBleConnected ? 'Desconectar Bancada' : 'Escanear & Conectar'}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* 2. SELETOR DE MÁQUINA */}
                {loadingMachines ? (
                    <ActivityIndicator size="small" color="#1A365D" style={{ marginVertical: 10 }} />
                ) : machines && machines.length > 0 ? (
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                        <View style={styles.machineHeader}>
                            <View>
                                <Text style={[styles.machineTitle, { color: textPrimary }]}>
                                    {currentMachine?.name || 'Selecione a Máquina'}
                                </Text>
                                <Text style={[styles.machineSubtitle, { color: textSec }]}>
                                    {currentMachine?.code} • {currentMachine?.station?.name || 'Posto Principal'}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.statusPill,
                                    {
                                        backgroundColor:
                                            currentMachine?.status === 'operational'
                                                ? '#00E67622'
                                                : currentMachine?.status === 'maintenance'
                                                ? '#E53E3E22'
                                                : '#71809622',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusPillText,
                                        {
                                            color:
                                                currentMachine?.status === 'operational'
                                                    ? '#00E676'
                                                    : currentMachine?.status === 'maintenance'
                                                    ? '#E53E3E'
                                                    : '#718096',
                                        },
                                    ]}
                                >
                                    {currentMachine?.status === 'operational'
                                        ? 'OPERACIONAL'
                                        : currentMachine?.status === 'maintenance'
                                        ? 'MANUTENÇÃO / E-STOP'
                                        : 'PARADO / IDLE'}
                                </Text>
                            </View>
                        </View>

                        {/* Lista horizontal se houver mais de uma máquina */}
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

                {/* 3. PARADA DE EMERGÊNCIA (NR-12) */}
                <View style={styles.estopSection}>
                    <Pressable
                        style={styles.estopButton}
                        onPress={handleEmergencyStop}
                        disabled={isSubmitting}
                    >
                        <View style={styles.estopRing}>
                            <View style={styles.estopCore}>
                                <Ionicons name="hand-left" size={38} color="#FFFFFF" />
                                <Text style={styles.estopText}>EMERGÊNCIA</Text>
                                <Text style={styles.estopSub}>E-STOP (NR-12)</Text>
                            </View>
                        </View>
                    </Pressable>
                    <Text style={[styles.estopDisclaimer, { color: textSec }]}>
                        Toque no cogumelo para desligamento imediato de emergência com registro de auditoria.
                    </Text>
                </View>

                {/* 4. CONTROLE DO MOTOR DA BANCADA */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>Controle de Potência (Motor M1)</Text>
                    <View style={styles.motorActionRow}>
                        <Pressable
                            style={[styles.motorBtn, styles.motorBtnStart]}
                            onPress={() => executeCommand('start')}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="play" size={24} color="#FFFFFF" />
                                    <Text style={styles.motorBtnText}>LIGAR MOTOR</Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            style={[styles.motorBtn, styles.motorBtnStop]}
                            onPress={() => executeCommand('stop')}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="stop" size={24} color="#FFFFFF" />
                            <Text style={styles.motorBtnText}>DESLIGAR</Text>
                        </Pressable>
                    </View>
                </View>

                {/* 5. AJUSTE DE ROTAÇÃO (RPM SETPOINT) */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.rpmHeader}>
                        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Setpoint de Rotação (RPM)</Text>
                        <Text style={styles.rpmValueLarge}>{targetRpm} RPM</Text>
                    </View>

                    {/* Presets Rápidos */}
                    <View style={styles.presetRow}>
                        {[900, 1200, 1750, 3600].map(rpm => (
                            <Pressable
                                key={rpm}
                                style={[
                                    styles.presetBtn,
                                    targetRpm === rpm && styles.presetBtnActive,
                                    { borderColor: border },
                                ]}
                                onPress={() => setTargetRpm(rpm)}
                            >
                                <Text
                                    style={[
                                        styles.presetText,
                                        targetRpm === rpm && styles.presetTextActive,
                                        { color: targetRpm === rpm ? '#FFFFFF' : textPrimary },
                                    ]}
                                >
                                    {rpm}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Stepper e Input */}
                    <View style={styles.stepperRow}>
                        <Pressable
                            style={[styles.stepperBtn, { borderColor: border }]}
                            onPress={() => setTargetRpm(prev => Math.max(0, prev - 50))}
                        >
                            <Ionicons name="remove" size={20} color={textPrimary} />
                        </Pressable>

                        <TextInput
                            style={[styles.rpmInput, { color: textPrimary, borderColor: border }]}
                            keyboardType="numeric"
                            value={String(targetRpm)}
                            onChangeText={txt => {
                                const parsed = parseInt(txt, 10);
                                if (!isNaN(parsed)) setTargetRpm(parsed);
                                else if (txt === '') setTargetRpm(0);
                            }}
                        />

                        <Pressable
                            style={[styles.stepperBtn, { borderColor: border }]}
                            onPress={() => setTargetRpm(prev => Math.min(10000, prev + 50))}
                        >
                            <Ionicons name="add" size={20} color={textPrimary} />
                        </Pressable>

                        <Pressable
                            style={styles.applyRpmBtn}
                            onPress={handleApplyRpm}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                            <Text style={styles.applyRpmText}>Aplicar</Text>
                        </Pressable>
                    </View>
                </View>

                {/* 6. ATUADORES AUXILIARES & RELÉS */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>Atuadores & Periféricos</Text>
                    
                    <View style={styles.auxGrid}>
                        {/* Relé 1: Iluminação */}
                        <Pressable
                            style={[
                                styles.auxCard,
                                relay1 && styles.auxCardActive,
                                { borderColor: relay1 ? '#00A86B' : border },
                            ]}
                            onPress={() => handleToggleRelay(1)}
                        >
                            <Ionicons
                                name={relay1 ? 'bulb' : 'bulb-outline'}
                                size={28}
                                color={relay1 ? '#00A86B' : textSec}
                            />
                            <Text style={[styles.auxTitle, { color: textPrimary }]}>Iluminação</Text>
                            <Text style={[styles.auxState, { color: relay1 ? '#00A86B' : textSec }]}>
                                {relay1 ? 'LIGADO' : 'DESLIGADO'}
                            </Text>
                        </Pressable>

                        {/* Relé 2: Exaustor */}
                        <Pressable
                            style={[
                                styles.auxCard,
                                relay2 && styles.auxCardActive,
                                { borderColor: relay2 ? '#00A86B' : border },
                            ]}
                            onPress={() => handleToggleRelay(2)}
                        >
                            <Ionicons
                                name={relay2 ? 'sync' : 'sync-outline'}
                                size={28}
                                color={relay2 ? '#00A86B' : textSec}
                            />
                            <Text style={[styles.auxTitle, { color: textPrimary }]}>Exaustor / Cooler</Text>
                            <Text style={[styles.auxState, { color: relay2 ? '#00A86B' : textSec }]}>
                                {relay2 ? 'LIGADO' : 'DESLIGADO'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Botão de Reset de Alarme */}
                    <Pressable
                        style={[styles.resetAlarmBtn, { borderColor: border }]}
                        onPress={() => executeCommand('reset_alarm')}
                    >
                        <Ionicons name="refresh-circle-outline" size={20} color="#1A365D" />
                        <Text style={styles.resetAlarmText}>Resetar Alarmes & Falhas da Bancada</Text>
                    </Pressable>
                </View>

                {/* 7. LOG DE AUDITORIA DA SESSÃO */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, marginBottom: 30 }]}>
                    <View style={styles.logHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="receipt-outline" size={18} color="#1A365D" />
                            <Text style={[styles.sectionTitle, { color: textPrimary, marginLeft: 6 }]}>
                                Rastreabilidade de Comandos
                            </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: textSec }}>ISO 17025</Text>
                    </View>

                    {commandLogs.length === 0 ? (
                        <Text style={[styles.emptyLogText, { color: textSec }]}>
                            Nenhum comando despachado nesta sessão.
                        </Text>
                    ) : (
                        commandLogs.map(item => (
                            <View key={item.id} style={[styles.logItem, { borderColor: border }]}>
                                <View style={styles.logItemLeft}>
                                    <Ionicons
                                        name={item.success ? 'checkmark-circle' : 'close-circle'}
                                        size={18}
                                        color={item.success ? '#00E676' : '#E53E3E'}
                                    />
                                    <View style={{ marginLeft: 8 }}>
                                        <Text style={[styles.logCommandName, { color: textPrimary }]}>
                                            {item.command.toUpperCase()}
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
        color: '#00E676',
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
    },
    statusPillText: {
        fontSize: 10,
        fontFamily: Fonts.sansBold,
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
    estopSection: {
        alignItems: 'center',
        marginVertical: 10,
    },
    estopButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#B91C1C',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 10,
    },
    estopRing: {
        width: 124,
        height: 124,
        borderRadius: 62,
        borderWidth: 4,
        borderColor: '#FCA5A5',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DC2626',
    },
    estopCore: {
        alignItems: 'center',
    },
    estopText: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 13,
        letterSpacing: 1,
        marginTop: 4,
    },
    estopSub: {
        color: '#FEE2E2',
        fontSize: 9,
        fontFamily: Fonts.sansSemiBold,
    },
    estopDisclaimer: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 10,
        maxWidth: 280,
    },
    motorActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    motorBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    motorBtnStart: {
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
    },
    motorBtnStop: {
        backgroundColor: '#334155',
        shadowColor: '#334155',
    },
    motorBtnText: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 14,
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    rpmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rpmValueLarge: {
        fontSize: 18,
        fontFamily: Fonts.sansBold,
        color: '#00A86B',
    },
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 12,
    },
    presetBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetBtnActive: {
        backgroundColor: '#1A365D',
        borderColor: '#1A365D',
    },
    presetText: {
        fontSize: 12,
        fontFamily: Fonts.sansSemiBold,
    },
    presetTextActive: {
        color: '#FFFFFF',
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepperBtn: {
        width: 42,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rpmInput: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        textAlign: 'center',
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
    },
    applyRpmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A365D',
        paddingHorizontal: 14,
        height: 42,
        borderRadius: 10,
    },
    applyRpmText: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        marginLeft: 4,
    },
    auxGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    auxCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    auxCardActive: {
        backgroundColor: '#00A86B0A',
    },
    auxTitle: {
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
        marginTop: 6,
        textAlign: 'center',
    },
    auxState: {
        fontSize: 11,
        fontFamily: Fonts.sansBold,
        marginTop: 2,
    },
    resetAlarmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: '#F8FAFC',
    },
    resetAlarmText: {
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
        color: '#1A365D',
        marginLeft: 6,
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
