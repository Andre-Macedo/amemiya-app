/**
 * Tipos e Interfaces para o Subsistema BLE Universal Industrial
 */

export type MetrologyUnit = 'mm' | 'in' | 'deg' | 'celsius' | 'percent' | 'raw';

export interface MetrologyBleReading {
    numericValue: number;
    unit: MetrologyUnit;
    rawString: string;
    timestamp: number;
    batteryLevel?: number;
    isStable?: boolean;
}

export interface BleDeviceDriver {
    id: string; // Ex: 'nordic-uart', 'sylvac', 'mitutoyo-uwave', 'sig-environmental', 'generic-custom'
    name: string;
    description: string;
    serviceUuid: string;
    characteristicUuid: string;
    /**
     * Retorna se este driver é compatível com o periférico escaneado
     */
    matchesDevice: (deviceName?: string | null, serviceUuids?: string[] | null) => boolean;
    /**
     * Decodifica a carga Base64/Bytes recebida pela notificação BLE
     */
    parseReading: (base64Value: string) => MetrologyBleReading | null;
}

export interface PairedBleDevice {
    id: string; // MAC address ou UUID do dispositivo
    name: string;
    driverId: string;
    customServiceUuid?: string;
    customCharUuid?: string;
    lastConnectedAt?: number;
}

export type BleConnectionStatus =
    | 'Desconectado'
    | 'Escaneando...'
    | 'Conectando...'
    | 'Conectado'
    | 'Erro Scan'
    | 'Erro Conexão';
