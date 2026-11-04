import { atob } from 'react-native-quick-base64';
import { BleDeviceDriver, MetrologyBleReading } from '../ble-types';

export const NORDIC_UART_SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E".toLowerCase();
export const NORDIC_UART_CHAR_TX_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E".toLowerCase();
export const NORDIC_UART_CHAR_RX_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E".toLowerCase();

/**
 * Constrói comando serial ASCII para envio à bancada / ESP32 via Nordic UART.
 */
export const buildNordicUartCommand = (
    command: 'silence_buzzer' | 'reset_alarm' | 'test_buzzer' | 'emergency_stop' | string,
    options?: { rpm?: number; relay_index?: number; relay_state?: boolean; reason?: string }
): string => {
    switch (command) {
        case 'silence_buzzer':
        case 'mute_buzzer':
        case 'mute':
            return 'CMD:MUTE\n';
        case 'reset_alarm':
        case 'reset':
            return 'CMD:RESET\n';
        case 'test_buzzer':
            return 'CMD:TEST_BUZZER\n';
        case 'emergency_stop':
            return 'CMD:ESTOP\n';
        case 'start':
            return 'CMD:START\n';
        case 'stop':
            return 'CMD:STOP\n';
        case 'set_rpm':
            return `CMD:SET_RPM:${options?.rpm ?? 1750}\n`;
        case 'toggle_relay':
            return `CMD:RELAY:${options?.relay_index ?? 1}:${options?.relay_state ? '1' : '0'}\n`;
        default:
            return `CMD:${command.toUpperCase()}\n`;
    }
};

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
