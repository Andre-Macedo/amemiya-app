import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useBLE } from '@/hooks/use-ble';
import { removePairedBleDevice } from '@/services/ble/paired-devices-storage';
import { Device } from 'react-native-ble-plx';
import * as Haptics from 'expo-haptics';

export default function BleDevicesScreen() {
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const {
        device,
        connectionStatus,
        lastValue,
        activeReading,
        activeDriver,
        scannedDevices,
        pairedDevices,
        allDrivers,
        scanAndConnect,
        connectWithDriver,
        disconnect,
        stopScan,
        batteryLevel,
        isScanning,
        isConnected,
    } = useBLE();

    const [selectedDriverId, setSelectedDriverId] = useState<string>('nordic-uart');

    const handleConnectScanned = async (targetDevice: Device) => {
        try {
            await connectWithDriver(targetDevice, selectedDriverId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch {
            Alert.alert('Erro de Conexão', 'Não foi possível conectar ao dispositivo BLE.');
        }
    };

    const handleRemovePaired = async (id: string) => {
        await removePairedBleDevice(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    };

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Dispositivos BLE" showBack />

            <ScrollView contentContainerStyle={styles.container}>
                {/* 1. Status do Dispositivo Conectado */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleRow}>
                            <Ionicons
                                name={isConnected ? 'bluetooth' : 'bluetooth-outline'}
                                size={22}
                                color={isConnected ? '#34C759' : '#FF9500'}
                            />
                            <Text style={[styles.cardTitle, { color: text }]}>
                                {isConnected ? (device?.name || 'Instrumento Conectado') : 'Nenhum Dispositivo Conectado'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#34C75922' : '#FF950022' }]}>
                            <Text style={[styles.statusText, { color: isConnected ? '#34C759' : '#FF9500' }]}>
                                {connectionStatus}
                            </Text>
                        </View>
                    </View>

                    {isConnected && (
                        <View style={styles.connectedDetails}>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: textSec }]}>Driver Ativo:</Text>
                                <Text style={[styles.infoValue, { color: text }]}>{activeDriver?.name}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: textSec }]}>Bateria do Transceptor:</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons
                                        name={batteryLevel && batteryLevel > 20 ? 'battery-charging' : 'battery-dead'}
                                        size={16}
                                        color={batteryLevel && batteryLevel > 20 ? '#34C759' : '#FF3B30'}
                                    />
                                    <Text style={[styles.infoValue, { color: text }]}>
                                        {batteryLevel !== null ? `${batteryLevel}%` : 'Alimentação Direta / N/A'}
                                    </Text>
                                </View>
                            </View>

                            {/* Live Value Preview Box */}
                            <View style={[styles.previewBox, { backgroundColor: primary + '12', borderColor: primary }]}>
                                <Text style={[styles.previewLabel, { color: textSec }]}>Leitura em Tempo Real:</Text>
                                <Text style={[styles.previewValue, { color: primary }]}>
                                    {lastValue ?? '--.---'} {activeReading?.unit ?? 'mm'}
                                </Text>
                            </View>

                            <Pressable
                                style={[styles.disconnectBtn, { borderColor: '#FF3B30' }]}
                                onPress={disconnect}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
                                <Text style={styles.disconnectBtnText}>Desconectar</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* 2. Seletor de Driver de Comunicação */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, marginTop: 14 }]}>
                    <Text style={[styles.cardTitle, { color: text, marginBottom: 8 }]}>
                        Driver do Fabricante
                    </Text>
                    <Text style={[styles.cardSub, { color: textSec, marginBottom: 12 }]}>
                        Escolha o protocolo de decodificação correspondente ao seu instrumento:
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll}>
                        {allDrivers.map(drv => {
                            const isSel = selectedDriverId === drv.id;
                            return (
                                <Pressable
                                    key={drv.id}
                                    style={[
                                        styles.driverChip,
                                        {
                                            backgroundColor: isSel ? primary : border + '30',
                                            borderColor: isSel ? primary : border,
                                        },
                                    ]}
                                    onPress={() => setSelectedDriverId(drv.id)}
                                >
                                    <Text style={[styles.driverChipText, { color: isSel ? '#fff' : text }]}>
                                        {drv.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* 3. Botão de Scan */}
                <View style={styles.scanActions}>
                    <Pressable
                        style={[styles.scanBtn, { backgroundColor: isScanning ? '#FF9500' : primary }]}
                        onPress={isScanning ? stopScan : scanAndConnect}
                    >
                        {isScanning ? (
                            <>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.scanBtnText}>Parar Escaneamento</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="search-outline" size={18} color="#fff" />
                                <Text style={styles.scanBtnText}>Escanear Novos Dispositivos</Text>
                            </>
                        )}
                    </Pressable>
                </View>

                {/* 4. Lista de Dispositivos Pareados / Salvos */}
                {pairedDevices.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Dispositivos Salvos</Text>
                        {pairedDevices.map(pd => (
                            <View key={pd.id} style={[styles.deviceRow, { backgroundColor: cardBg, borderColor: border }]}>
                                <View style={styles.deviceInfo}>
                                    <Ionicons name="hardware-chip-outline" size={20} color={primary} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={[styles.deviceName, { color: text }]}>{pd.name}</Text>
                                        <Text style={[styles.deviceDriver, { color: textSec }]}>
                                            Driver: {pd.driverId} • ID: {pd.id.substring(0, 14)}...
                                        </Text>
                                    </View>
                                </View>
                                <Pressable hitSlop={10} onPress={() => handleRemovePaired(pd.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                {/* 5. Lista de Dispositivos Escaneados */}
                <View style={{ marginTop: 20 }}>
                    <Text style={[styles.sectionTitle, { color: text }]}>
                        Dispositivos Detectados no Ar ({scannedDevices.length})
                    </Text>

                    {scannedDevices.length === 0 ? (
                        <Text style={[styles.emptyText, { color: textSec }]}>
                            {isScanning ? 'Procurando sinais Bluetooth...' : 'Toque em Escanear para buscar instrumentos.'}
                        </Text>
                    ) : (
                        scannedDevices.map(sd => (
                            <Pressable
                                key={sd.id}
                                style={[styles.scannedRow, { backgroundColor: cardBg, borderColor: border }]}
                                onPress={() => handleConnectScanned(sd)}
                            >
                                <View style={styles.deviceInfo}>
                                    <Ionicons name="radio-outline" size={22} color={primary} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={[styles.deviceName, { color: text }]}>
                                            {sd.name || 'Dispositivo sem nome'}
                                        </Text>
                                        <Text style={[styles.deviceDriver, { color: textSec }]}>
                                            RSSI: {sd.rssi ?? 'N/A'} dBm • {sd.id}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.connectBadge, { backgroundColor: primary + '18' }]}>
                                    <Text style={[styles.connectBadgeText, { color: primary }]}>Conectar</Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    cardTitle: {
        fontFamily: Fonts.sansBold,
        fontSize: 16,
    },
    cardSub: {
        fontFamily: Fonts.sans,
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    connectedDetails: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#00000010',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontFamily: Fonts.sans,
        fontSize: 13,
    },
    infoValue: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    previewBox: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 14,
        alignItems: 'center',
        marginVertical: 12,
    },
    previewLabel: {
        fontFamily: Fonts.sans,
        fontSize: 11,
        marginBottom: 4,
    },
    previewValue: {
        fontFamily: Fonts.sansBold,
        fontSize: 28,
    },
    disconnectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    disconnectBtnText: {
        color: '#FF3B30',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    driverScroll: {
        flexDirection: 'row',
        gap: 8,
    },
    driverChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    driverChipText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    scanActions: {
        marginTop: 16,
    },
    scanBtn: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    scanBtnText: {
        color: '#fff',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
    },
    sectionTitle: {
        fontFamily: Fonts.sansBold,
        fontSize: 15,
        marginBottom: 10,
    },
    deviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    scannedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deviceName: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    deviceDriver: {
        fontFamily: Fonts.sans,
        fontSize: 11,
        marginTop: 2,
    },
    connectBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    connectBadgeText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    emptyText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 20,
    },
});
