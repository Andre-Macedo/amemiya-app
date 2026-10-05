import { atob } from 'react-native-quick-base64';
import { BleDeviceDriver, MetrologyBleReading } from '../ble-types';

export const SIG_ENV_SERVICE_UUID = "0000181a-0000-1000-8000-00805f9b34fb".toLowerCase();
export const SIG_TEMP_CHAR_UUID = "00002a6e-0000-1000-8000-00805f9b34fb".toLowerCase();
export const SIG_HUMIDITY_CHAR_UUID = "00002a6f-0000-1000-8000-00805f9b34fb".toLowerCase();

/**
 * Driver para Sensores Ambientais com perfil padrão Bluetooth SIG (0x181A).
 */
export const SigEnvironmentalDriver: BleDeviceDriver = {
    id: 'sig-environmental',
    name: 'Bluetooth SIG Environmental (Temp & Umidade)',
    description: 'Padrão internacional Bluetooth SIG para monitoramento ambiental.',
    serviceUuid: SIG_ENV_SERVICE_UUID,
    characteristicUuid: SIG_TEMP_CHAR_UUID,

    matchesDevice: (_deviceName?: string | null, serviceUuids?: string[] | null): boolean => {
        if (!serviceUuids) return false;
        return serviceUuids.some(uuid => uuid.toLowerCase().includes('181a'));
    },

    parseReading: (base64Value: string): MetrologyBleReading | null => {
        try {
            const raw = atob(base64Value);
            if (!raw || raw.length < 2) return null;

            // IEEE 11073-20601 16-bit integer com resolução 0.01 °C
            const b0 = raw.charCodeAt(0);
            const b1 = raw.charCodeAt(1);
            let val = b0 | (b1 << 8);
            if (val >= 0x8000) {
                val = val - 0x10000;
            }

            const numericValue = val / 100.0;

            return {
                numericValue,
                unit: 'celsius',
                rawString: `${numericValue.toFixed(2)} °C`,
                timestamp: Date.now(),
                isStable: true
            };
        } catch (error) {
            console.warn('[SigEnvironmentalDriver] Erro ao decodificar:', error);
            return null;
        }
    }
};
