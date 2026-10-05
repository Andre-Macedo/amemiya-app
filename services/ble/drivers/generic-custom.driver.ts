import { atob } from 'react-native-quick-base64';
import { BleDeviceDriver, MetrologyBleReading } from '../ble-types';

/**
 * Driver Genérico para Dispositivos Industriais Customizados
 * Permite conexão com qualquer equipamento fornecendo os UUIDs de serviço e característica.
 */
export const createGenericCustomDriver = (serviceUuid: string, characteristicUuid: string): BleDeviceDriver => ({
    id: 'generic-custom',
    name: 'Dispositivo Customizado / Engenharia',
    description: 'Driver genérico para qualquer periférico BLE industrial configurado manualmente.',
    serviceUuid: serviceUuid.toLowerCase(),
    characteristicUuid: characteristicUuid.toLowerCase(),

    matchesDevice: (): boolean => false, // Selecionado manualmente pelo usuário

    parseReading: (base64Value: string): MetrologyBleReading | null => {
        try {
            const rawText = atob(base64Value).trim();
            if (!rawText) return null;

            const match = rawText.match(/[+-]?\d+\.?\d*/);
            const numericValue = match ? parseFloat(match[0]) : 0;

            return {
                numericValue: isNaN(numericValue) ? 0 : numericValue,
                unit: 'raw',
                rawString: rawText,
                timestamp: Date.now(),
                isStable: true
            };
        } catch {
            return null;
        }
    }
});
