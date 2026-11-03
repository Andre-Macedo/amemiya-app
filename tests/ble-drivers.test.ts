import { NordicUartDriver } from '@/services/ble/drivers/nordic-uart.driver';
import { MitutoyoUWaveDriver } from '@/services/ble/drivers/mitutoyo-uwave.driver';
import { SylvacDriver } from '@/services/ble/drivers/sylvac.driver';
import { findMatchingDriver } from '@/services/ble/drivers';

describe('BLE Metrology Drivers Suite', () => {
    describe('NordicUartDriver (ESP32 DRO & Pedal)', () => {
        it('deve identificar corretamente dispositivos Nordic UART e ESP32', () => {
            expect(NordicUartDriver.matchesDevice('EspDRO_BT')).toBe(true);
            expect(NordicUartDriver.matchesDevice('EspDRO_BLE')).toBe(true);
            expect(NordicUartDriver.matchesDevice('ESP32_Metrology_Pedal')).toBe(true);
            expect(NordicUartDriver.matchesDevice('OtherDevice')).toBe(false);
            expect(NordicUartDriver.matchesDevice(null, ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'])).toBe(true);
        });

        it('deve decodificar strings ASCII numéricas de medição', () => {
            // "25.400" em Base64 é "MjUuNDAw"
            const b64 = Buffer.from('25.400').toString('base64');
            const result = NordicUartDriver.parseReading(b64);

            expect(result).not.toBeNull();
            expect(result?.numericValue).toBe(25.4);
            expect(result?.unit).toBe('mm');
            expect(result?.isStable).toBe(true);
        });

        it('deve decodificar valores negativos e em polegadas', () => {
            const b64 = Buffer.from('-1.250 in').toString('base64');
            const result = NordicUartDriver.parseReading(b64);

            expect(result).not.toBeNull();
            expect(result?.numericValue).toBe(-1.25);
            expect(result?.unit).toBe('in');
        });
    });

    describe('MitutoyoUWaveDriver (Digimatic Protocol)', () => {
        it('deve identificar dispositivos Mitutoyo e U-WAVE', () => {
            expect(MitutoyoUWaveDriver.matchesDevice('U-WAVE_TC_01')).toBe(true);
            expect(MitutoyoUWaveDriver.matchesDevice('Mitutoyo Caliper')).toBe(true);
            expect(MitutoyoUWaveDriver.matchesDevice('RandomBLE')).toBe(false);
        });

        it('deve decodificar payload típico Digimatic Mitutoyo', () => {
            // Formato Digimatic U-Wave: "01+00015.02" -> Base64 "MDErMDAwMTUuMDI="
            const raw = '01+00015.02';
            const b64 = Buffer.from(raw).toString('base64');
            const result = MitutoyoUWaveDriver.parseReading(b64);

            expect(result).not.toBeNull();
            expect(result?.numericValue).toBe(15.02);
            expect(result?.unit).toBe('mm');
        });
    });

    describe('SylvacDriver (Bluetooth Smart)', () => {
        it('deve identificar instrumentos Sylvac e Fowler', () => {
            expect(SylvacDriver.matchesDevice('SYLVAC_CALIPER_S_CAL')).toBe(true);
            expect(SylvacDriver.matchesDevice('FOWLER_MICROMETER')).toBe(true);
            expect(SylvacDriver.matchesDevice('Generic_Scale')).toBe(false);
        });

        it('deve decodificar valores ASCII enviados por relógios Sylvac', () => {
            const b64 = Buffer.from('+12.345').toString('base64');
            const result = SylvacDriver.parseReading(b64);

            expect(result).not.toBeNull();
            expect(result?.numericValue).toBe(12.345);
            expect(result?.unit).toBe('mm');
        });

        it('deve decodificar payload binário de 4 bytes (int32 Little-Endian / 1000)', () => {
            // 25.400 mm = 25400 unidades inteiras
            const buffer = Buffer.alloc(4);
            buffer.writeInt32LE(25400, 0);
            const b64 = buffer.toString('base64');

            const result = SylvacDriver.parseReading(b64);
            expect(result).not.toBeNull();
            expect(result?.numericValue).toBe(25.4);
            expect(result?.unit).toBe('mm');
        });
    });

    describe('findMatchingDriver (Registry Auto-Detect)', () => {
        it('deve retornar o driver correspondente automaticamente pelo nome', () => {
            expect(findMatchingDriver('EspDRO_BT').id).toBe('nordic-uart');
            expect(findMatchingDriver('U-WAVE_TM').id).toBe('mitutoyo-uwave');
            expect(findMatchingDriver('Sylvac Ultra-Cal').id).toBe('sylvac');
        });
    });
});
