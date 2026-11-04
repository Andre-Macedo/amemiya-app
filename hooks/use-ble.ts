import { useState, useMemo, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import * as Haptics from 'expo-haptics';
import { toByteArray, btoa } from 'react-native-quick-base64';

import {
    BleConnectionStatus,
    BleDeviceDriver,
    MetrologyBleReading,
    PairedBleDevice
} from '@/services/ble/ble-types';
import {
    REGISTERED_DRIVERS,
    findMatchingDriver,
    NordicUartDriver,
    createGenericCustomDriver
} from '@/services/ble/drivers';
import {
    NORDIC_UART_CHAR_RX_UUID,
    NORDIC_UART_SERVICE_UUID
} from '@/services/ble/drivers/nordic-uart.driver';
import {
    getPairedBleDevices,
    savePairedBleDevice
} from '@/services/ble/paired-devices-storage';

export function useBLE() {
    const manager = useMemo(() => new BleManager(), []);

    const [device, setDevice] = useState<Device | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<BleConnectionStatus>('Desconectado');
    const [lastValue, setLastValue] = useState<string | null>(null);
    const [activeReading, setActiveReading] = useState<MetrologyBleReading | null>(null);
    const [activeDriver, setActiveDriver] = useState<BleDeviceDriver>(NordicUartDriver);
    const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
    const [pairedDevices, setPairedDevices] = useState<PairedBleDevice[]>([]);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // Carrega dispositivos pareados no início
    useEffect(() => {
        getPairedBleDevices().then(setPairedDevices).catch(console.warn);
    }, []);

    // 1. Permissões Android 12+ e Anteriores
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true;
    }, []);

    // 2. Iniciar Escuta (Monitor / Subscribe) da Característica
    const startStreaming = useCallback((connectedDevice: Device, driver: BleDeviceDriver) => {
        let subscription: Subscription | null = null;

        subscription = connectedDevice.monitorCharacteristicForService(
            driver.serviceUuid,
            driver.characteristicUuid,
            (error, characteristic) => {
                if (error) {
                    if (error.errorCode === 201) return; // Dispositivo desconectou
                    console.warn('[useBLE] Erro de monitoramento:', error);
                    return;
                }

                if (characteristic?.value) {
                    const parsed = driver.parseReading(characteristic.value);
                    if (parsed) {
                        // Atualiza os estados
                        setLastValue(parsed.rawString);
                        setActiveReading(parsed);

                        // Feedback háptico instantâneo na captura de cada cota
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    }
                }
            }
        );

        return () => {
            subscription?.remove();
        };
    }, []);

    // 3. Conectar a um dispositivo usando um Driver específico
    const connectToDevice = useCallback(async (targetDevice: Device, driver: BleDeviceDriver) => {
        try {
            setConnectionStatus('Conectando...');
            const connectedDevice = await targetDevice.connect();
            setDevice(connectedDevice);
            setActiveDriver(driver);

            await connectedDevice.discoverAllServicesAndCharacteristics();
            setConnectionStatus('Conectado');

            // Leitura opcional do Battery Service (0x180F / 0x2A19)
            try {
                const services = await connectedDevice.services();
                const batteryService = services.find(s => s.uuid.toLowerCase().includes('180f'));
                if (batteryService) {
                    const chars = await batteryService.characteristics();
                    const batteryChar = chars.find(c => c.uuid.toLowerCase().includes('2a19'));
                    if (batteryChar) {
                        const readChar = await batteryChar.read();
                        if (readChar?.value) {
                            const bytes = toByteArray(readChar.value);
                            if (bytes.length > 0) {
                                setBatteryLevel(bytes[0]);
                            }
                        }
                    }
                }
            } catch {
                // Dispositivo não possui Battery Service padrão (normal em ESP32 custom)
            }

            // Salva na lista de pareados para reconexão rápida
            await savePairedBleDevice({
                id: connectedDevice.id,
                name: connectedDevice.name || 'Dispositivo Metrológico',
                driverId: driver.id,
                customServiceUuid: driver.serviceUuid,
                customCharUuid: driver.characteristicUuid,
            });
            const updated = await getPairedBleDevices();
            setPairedDevices(updated);

            // Inicia streaming com o driver escolhido
            startStreaming(connectedDevice, driver);

            // Listener de desconexão para auto-reconexão silenciosa
            connectedDevice.onDisconnected((error) => {
                setConnectionStatus('Desconectado');
                setDevice(null);
                setBatteryLevel(null);
                if (error) {
                    console.log('[useBLE] Desconexão imprevista do dispositivo, tentando auto-reconexão...');
                    setTimeout(() => {
                        targetDevice.connect()
                            .then(reconnected => {
                                setDevice(reconnected);
                                setConnectionStatus('Conectado');
                                startStreaming(reconnected, driver);
                            })
                            .catch(() => {});
                    }, 2500);
                }
            });

            // Feedback háptico de conexão realizada
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch (e) {
            console.error('[useBLE] Erro ao conectar:', e);
            setConnectionStatus('Erro Conexão');
            setDevice(null);
        }
    }, [startStreaming]);

    // 4. Escanear e Conectar Automaticamente (Compatibilidade Total com ESP32 atual)
    const scanAndConnect = useCallback(async () => {
        const permission = await requestPermissions();
        if (!permission) {
            console.log('[useBLE] Permissão BLE negada');
            return;
        }

        setConnectionStatus('Escaneando...');
        setIsScanning(true);
        setScannedDevices([]);

        manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
                console.warn('[useBLE] Erro Scan:', error);
                setConnectionStatus('Erro Scan');
                setIsScanning(false);
                return;
            }

            if (scannedDevice) {
                // Adiciona na lista geral de escaneados
                setScannedDevices(prev => {
                    if (prev.some(d => d.id === scannedDevice.id)) return prev;
                    return [...prev, scannedDevice];
                });

                // Auto-conectar ao ESP32 do usuário se detectado (comportamento original preservado!)
                const name = scannedDevice.name;
                if (name === 'EspDRO_BT' || name === 'EspDRO_BLE') {
                    manager.stopDeviceScan();
                    setIsScanning(false);
                    connectToDevice(scannedDevice, NordicUartDriver);
                }
            }
        });
    }, [manager, requestPermissions, connectToDevice]);

    // 5. Conexão Manual a qualquer dispositivo com driver selecionado
    const connectWithDriver = useCallback(async (
        targetDevice: Device,
        driverId: string,
        customUuids?: { serviceUuid: string; charUuid: string }
    ) => {
        manager.stopDeviceScan();

        let driver: BleDeviceDriver | undefined;
        if (driverId === 'generic-custom' && customUuids) {
            driver = createGenericCustomDriver(customUuids.serviceUuid, customUuids.charUuid);
        } else {
            driver = REGISTERED_DRIVERS.find(d => d.id === driverId) ||
                     findMatchingDriver(targetDevice.name, targetDevice.serviceUUIDs);
        }

        await connectToDevice(targetDevice, driver);
    }, [manager, connectToDevice]);

    const disconnect = useCallback(async () => {
        if (device) {
            try {
                await device.cancelConnection();
            } catch (e) {
                console.warn('[useBLE] Erro ao desconectar:', e);
            }
        }
        setDevice(null);
        setConnectionStatus('Desconectado');
        setLastValue(null);
        setActiveReading(null);
    }, [device]);

    const sendBleCommand = useCallback(async (commandString: string): Promise<boolean> => {
        if (!device) {
            console.warn('[useBLE] Dispositivo não conectado para envio de comando');
            return false;
        }

        try {
            const base64Data = btoa(commandString);
            const targetChar = NORDIC_UART_CHAR_RX_UUID;
            const targetService = NORDIC_UART_SERVICE_UUID;

            try {
                await device.writeCharacteristicWithResponseForService(
                    targetService,
                    targetChar,
                    base64Data
                );
            } catch {
                await device.writeCharacteristicWithoutResponseForService(
                    targetService,
                    targetChar,
                    base64Data
                );
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            return true;
        } catch (e) {
            console.warn('[useBLE] Falha ao enviar comando via BLE:', e);
            return false;
        }
    }, [device]);

    return {
        // Campos originais preservados (100% retrocompatível)
        scanAndConnect,
        connectionStatus,
        lastValue,
        isConnected: !!device,

        // Novos recursos universais
        device,
        activeReading,
        activeDriver,
        scannedDevices,
        pairedDevices,
        allDrivers: REGISTERED_DRIVERS,
        connectWithDriver,
        disconnect,
        sendBleCommand,
        batteryLevel,
        isScanning,
        stopScan: () => {
            manager.stopDeviceScan();
            setIsScanning(false);
            setConnectionStatus(device ? 'Conectado' : 'Desconectado');
        }
    };
}