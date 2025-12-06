import { useState, useMemo } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { atob } from 'react-native-quick-base64'; // Se der erro aqui, veja a nota abaixo*

// UUIDs do seu ESP32
const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const CHAR_UUID_TX = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

export function useBLE() {
    const manager = useMemo(() => new BleManager(), []);

    const [device, setDevice] = useState<Device | null>(null);
    const [connectionStatus, setConnectionStatus] = useState('Desconectado');
    const [lastValue, setLastValue] = useState<string | null>(null);


    // 1. Permissões Robustas
    const requestPermissions = async () => {
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
    };

    // 2. Escanear e Conectar
    const scanAndConnect = async () => {
        const permission = await requestPermissions();
        if (!permission) {
            console.log("Permissão negada");
            return;
        }

        setConnectionStatus('Escaneando...');

        manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
                console.warn(error);
                setConnectionStatus('Erro Scan');
                return;
            }

            // Filtro pelo nome do ESP32
            if (scannedDevice && (scannedDevice.name === 'EspDRO_BT' || scannedDevice.name === 'EspDRO_BLE')) {
                manager.stopDeviceScan();
                connectToDevice(scannedDevice);
            }
        });
    };

    // 3. Conectar e Monitorar
    const connectToDevice = async (device: Device) => {
        try {
            setConnectionStatus('Conectando...');
            const connectedDevice = await device.connect();
            setDevice(connectedDevice);

            await connectedDevice.discoverAllServicesAndCharacteristics();
            setConnectionStatus('Conectado');

            // INICIAR ESCUTA (Subscribe)
            startStreaming(connectedDevice);

        } catch (e) {
            console.log('Erro ao conectar', e);
            setConnectionStatus('Erro Conexão');
            setDevice(null);
        }
    };

    // 4. Ler Dados em Tempo Real
    const startStreaming = async (device: Device) => {
        device.monitorCharacteristicForService(
            SERVICE_UUID,
            CHAR_UUID_TX,
            (error, characteristic) => {
                if (error) {
                    if (error.errorCode === 201) return; // Dispositivo desconectou
                    console.log('Erro leitura:', error);
                    return;
                }

                if (characteristic?.value) {
                    // O dado vem em Base64 do ESP32. Precisamos converter para texto.
                    const rawBase64 = characteristic.value;
                    const text = atob(rawBase64);

                    console.log(">>> ESP32 ENVIOU:", text); // Deve aparecer "32.92"
                    setLastValue(text);
                }
            }
        );
    };

    // Função manual de atob caso não queira instalar 'react-native-quick-base64'
    const atob = (input: string) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = input.replace(/=+$/, '');
        let output = '';
        if (str.length % 4 == 1) throw new Error("'atob' failed");
        for (let bc = 0, bs = 0, buffer, i = 0;
             buffer = str.charAt(i++);
             ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
             bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) { buffer = chars.indexOf(buffer); }
        return output;
    }

    return {
        scanAndConnect,
        connectionStatus,
        lastValue,
        isConnected: !!device
    };
}