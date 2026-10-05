import { useState, useMemo, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import * as Haptics from 'expo-haptics';

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

    // 2. Conectar a um dispositivo usando um Driver específico
    const connectToDevice = useCallback(async (targetDevice: Device, driver: BleDeviceDriver) => {
        try {
            setConnectionStatus('Conectando...');
            const connectedDevice = await targetDevice.connect();
            setDevice(connectedDevice);
            setActiveDriver(driver);

            await connectedDevice.discoverAllServicesAndCharacteristics();
            setConnectionStatus('Conectado');

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

            // Feedback háptico de conexão realizada
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch (e) {
            console.error('[useBLE] Erro ao conectar:', e);
            setConnectionStatus('Erro Conexão');
            setDevice(null);
        }
    }, []);

    // 3. Iniciar Escuta (Monitor / Subscribe) da Característica
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

    // 4. Escanear e Conectar Automaticamente (Compatibilidade Total com ESP32 atual)
    const scanAndConnect = useCallback(async () => {
        const permission = await requestPermissions();
        if (!permission) {
            console.log('[useBLE] Permissão BLE negada');
            return;
        }

        setConnectionStatus('Escaneando...');
        setScannedDevices([]);

        manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
                console.warn('[useBLE] Erro Scan:', error);
                setConnectionStatus('Erro Scan');
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
        stopScan: () => manager.stopDeviceScan()
    };
}