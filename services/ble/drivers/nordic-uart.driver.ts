import { atob } from 'react-native-quick-base64';
import { BleDeviceDriver, MetrologyBleReading } from '../ble-types';

export const NORDIC_UART_SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E".toLowerCase();
export const NORDIC_UART_CHAR_TX_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E".toLowerCase();

/**
 * Driver para hardware ESP32 / Conversores UART / Pedal de bancada
 * Utiliza o padrão internacional Nordic UART Service (NUS).
 */
export const NordicUartDriver: BleDeviceDriver = {
    id: 'nordic-uart',
    name: 'Nordic UART / ESP32 (Pedal & Bancada)',
    description: 'Comunicação serial virtual para ESP32, EspDRO_BT/BLE e conversores RS232.',
    serviceUuid: NORDIC_UART_SERVICE_UUID,
    characteristicUuid: NORDIC_UART_CHAR_TX_UUID,

    matchesDevice: (deviceName?: string | null, serviceUuids?: string[] | null): boolean => {
        if (!deviceName && !serviceUuids) return false;
        
        // Verifica se o nome corresponde aos dispositivos ESP32 configurados
        if (deviceName && (
            deviceName.startsWith('EspDRO') ||
            deviceName.includes('ESP32') ||
            deviceName.includes('UART') ||
            deviceName.includes('DRO')
        )) {
            return true;
        }

        // Verifica UUID de serviço anunciado
        if (serviceUuids && serviceUuids.some(uuid => uuid.toLowerCase() === NORDIC_UART_SERVICE_UUID)) {
            return true;
        }

        return false;
    },

    parseReading: (base64Value: string): MetrologyBleReading | null => {
        try {
            const rawText = atob(base64Value).trim();
            if (!rawText) return null;

            // Extrai o valor numérico (suporta formatos como "+0032.92", "32.92 mm", "-1.45")
            const cleanStr = rawText.replace(/[^0-9.-]/g, '');
            const numericValue = parseFloat(cleanStr);

            if (isNaN(numericValue)) {
                return null;
            }

            const unit = rawText.toLowerCase().includes('in') ? 'in' : 'mm';

            return {
                numericValue,
                unit,
                rawString: rawText,
                timestamp: Date.now(),
                isStable: true,
            };
        } catch (error) {
            console.warn('[NordicUartDriver] Erro ao decodificar carga Base64:', error);
            return null;
        }
    }
};
