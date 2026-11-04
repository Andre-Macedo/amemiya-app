import {
    buildNordicUartCommand,
    NORDIC_UART_CHAR_RX_UUID,
    NORDIC_UART_CHAR_TX_UUID,
    NORDIC_UART_SERVICE_UUID,
} from '@/services/ble/drivers/nordic-uart.driver';

describe('Industrial Remote Control & BLE Command Suite', () => {
    describe('Nordic UART Command Encoding (ESP32 Bancada M1)', () => {
        it('deve codificar corretamente o comando de SILENCIAR BUZZER (MUTE)', () => {
            expect(buildNordicUartCommand('silence_buzzer')).toBe('CMD:MUTE\n');
            expect(buildNordicUartCommand('mute_buzzer')).toBe('CMD:MUTE\n');
            expect(buildNordicUartCommand('mute')).toBe('CMD:MUTE\n');
        });

        it('deve codificar comando de RESET DE ALARME (RESET)', () => {
            expect(buildNordicUartCommand('reset_alarm')).toBe('CMD:RESET\n');
            expect(buildNordicUartCommand('reset')).toBe('CMD:RESET\n');
        });

        it('deve codificar comando de TESTE DE BUZZER (TEST_BUZZER)', () => {
            expect(buildNordicUartCommand('test_buzzer')).toBe('CMD:TEST_BUZZER\n');
        });

        it('deve codificar comando de PARADA DE EMERGÊNCIA (E-STOP)', () => {
            const cmd = buildNordicUartCommand('emergency_stop');
            expect(cmd).toBe('CMD:ESTOP\n');
        });

        it('deve lidar com comandos customizados em maiúsculas', () => {
            const cmd = buildNordicUartCommand('ping');
            expect(cmd).toBe('CMD:PING\n');
        });
    });

    describe('Nordic UART Characteristic UUIDs', () => {
        it('deve possuir UUIDs válidos para serviço, TX e RX do padrão Nordic UART', () => {
            expect(NORDIC_UART_SERVICE_UUID).toBe('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
            expect(NORDIC_UART_CHAR_RX_UUID).toBe('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
            expect(NORDIC_UART_CHAR_TX_UUID).toBe('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
        });
    });
});
