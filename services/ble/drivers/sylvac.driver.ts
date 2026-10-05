import { atob } from 'react-native-quick-base64';
import { BleDeviceDriver, MetrologyBleReading } from '../ble-types';

export const SYLVAC_METROLOGY_SERVICE_UUID = "c1b25000-ca55-410f-ad30-80a5bf237000".toLowerCase();
export const SYLVAC_DATA_CHAR_UUID = "c1b25010-ca55-410f-ad30-80a5bf237000".toLowerCase();

/**
 * Driver para Paquímetros, Micrômetros e Relógios Comparadores Sylvac / Fowler Bluetooth Smart.
 */
export const SylvacDriver: BleDeviceDriver = {
    id: 'sylvac',
    name: 'Sylvac / Fowler Bluetooth Smart',
    description: 'Protocolo nativo Sylvac para instrumentos metrológicos industriais.',
    serviceUuid: SYLVAC_METROLOGY_SERVICE_UUID,
    characteristicUuid: SYLVAC_DATA_CHAR_UUID,

    matchesDevice: (deviceName?: string | null, serviceUuids?: string[] | null): boolean => {
        if (!deviceName && !serviceUuids) return false;

        if (deviceName && (
            deviceName.toUpperCase().includes('SYLVAC') ||
            deviceName.toUpperCase().includes('FOWLER') ||
            deviceName.startsWith('SY')
        )) {
            return true;
        }

        if (serviceUuids && serviceUuids.some(uuid => uuid.toLowerCase().includes('c1b25000'))) {
            return true;
        }

        return false;
    },

    parseReading: (base64Value: string): MetrologyBleReading | null => {
        try {
            const raw = atob(base64Value);
            if (!raw || raw.length === 0) return null;

            // Se for string legível ASCII (alguns modelos Sylvac enviam em ASCII)
            if (/^[+\-0-9. ]+$/.test(raw.trim())) {
                const num = parseFloat(raw.trim());
                if (!isNaN(num)) {
                    return {
                        numericValue: num,
                        unit: 'mm',
                        rawString: raw.trim(),
                        timestamp: Date.now(),
                        isStable: true
                    };
                }
            }

            // Interpretação binária padrão Sylvac (4 bytes Little Endian int32 / 1000)
            if (raw.length >= 4) {
                const b0 = raw.charCodeAt(0);
                const b1 = raw.charCodeAt(1);
                const b2 = raw.charCodeAt(2);
                const b3 = raw.charCodeAt(3);

                // Converte para Int32 signed
                let val = (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24));
                if (val >= 0x80000000) {
                    val = val - 0x100000000;
                }

                // Resolução metrológica típica: 0.001 mm ou 0.01 mm
                const numericValue = val / 1000.0;

                return {
                    numericValue,
                    unit: 'mm',
                    rawString: `${numericValue.toFixed(3)} mm`,
                    timestamp: Date.now(),
                    isStable: true
                };
            }

            return null;
        } catch (e) {
            console.warn('[SylvacDriver] Erro de parsing:', e);
            return null;
        }
    }
};
