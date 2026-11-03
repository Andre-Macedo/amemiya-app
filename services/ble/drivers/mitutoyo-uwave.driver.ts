import { atob } from 'react-native-quick-base64';
import { BleDeviceDriver, MetrologyBleReading } from '../ble-types';

export const MITUTOYO_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb".toLowerCase();
export const MITUTOYO_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb".toLowerCase();

/**
 * Driver para transmissores Mitutoyo U-WAVE-TM / U-WAVE-TC (Bluetooth Digimatic).
 */
export const MitutoyoUWaveDriver: BleDeviceDriver = {
    id: 'mitutoyo-uwave',
    name: 'Mitutoyo U-WAVE Bluetooth',
    description: 'Protocolo sem fio Digimatic para instrumentos Mitutoyo.',
    serviceUuid: MITUTOYO_SERVICE_UUID,
    characteristicUuid: MITUTOYO_CHAR_UUID,

    matchesDevice: (deviceName?: string | null, serviceUuids?: string[] | null): boolean => {
        if (!deviceName && !serviceUuids) return false;

        if (deviceName && (
            deviceName.toUpperCase().includes('U-WAVE') ||
            deviceName.toUpperCase().includes('MITUTOYO') ||
            deviceName.toUpperCase().includes('UWAVE')
        )) {
            return true;
        }

        if (serviceUuids && serviceUuids.some(uuid => uuid.toLowerCase().includes('ffe0'))) {
            return true;
        }

        return false;
    },

    parseReading: (base64Value: string): MetrologyBleReading | null => {
        try {
            const rawText = atob(base64Value).trim();
            if (!rawText) return null;

            // Formato típico Digimatic Mitutoyo U-WAVE: "01+00025.40", "D1+025.40" ou "+025.40"
            // Procura primariamente pelo bloco com sinal [+-] correspondente à cota medida
            const signedMatch = rawText.match(/[+-]\d+\.?\d*/);
            const match = signedMatch || rawText.match(/\d+\.?\d*$/) || rawText.match(/[+-]?\d+\.?\d*/);
            if (!match) return null;

            const numericValue = parseFloat(match[0]);
            if (isNaN(numericValue)) return null;

            const unit = rawText.toLowerCase().includes('in') ? 'in' : 'mm';

            return {
                numericValue,
                unit,
                rawString: rawText,
                timestamp: Date.now(),
                isStable: true
            };
        } catch (error) {
            console.warn('[MitutoyoUWaveDriver] Erro ao decodificar:', error);
            return null;
        }
    }
};
