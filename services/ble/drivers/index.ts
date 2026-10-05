import { BleDeviceDriver } from '../ble-types';
import { NordicUartDriver } from './nordic-uart.driver';
import { SylvacDriver } from './sylvac.driver';
import { MitutoyoUWaveDriver } from './mitutoyo-uwave.driver';
import { SigEnvironmentalDriver } from './sig-environmental.driver';

export * from './nordic-uart.driver';
export * from './sylvac.driver';
export * from './mitutoyo-uwave.driver';
export * from './sig-environmental.driver';
export * from './generic-custom.driver';

/**
 * Registro de drivers nativos suportados
 * O NordicUartDriver é o primeiro (padrão) para manter total compatibilidade com o ESP32!
 */
export const REGISTERED_DRIVERS: BleDeviceDriver[] = [
    NordicUartDriver,
    SylvacDriver,
    MitutoyoUWaveDriver,
    SigEnvironmentalDriver,
];

/**
 * Tenta encontrar automaticamente o driver compatível para um dispositivo
 */
export function findMatchingDriver(deviceName?: string | null, serviceUuids?: string[] | null): BleDeviceDriver {
    for (const driver of REGISTERED_DRIVERS) {
        if (driver.matchesDevice(deviceName, serviceUuids)) {
            return driver;
        }
    }
    // Fallback padrão: NordicUartDriver (ESP32)
    return NordicUartDriver;
}
