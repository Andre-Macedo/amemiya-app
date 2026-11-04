import {
    buildNordicUartCommand,
    NORDIC_UART_CHAR_RX_UUID,
    NORDIC_UART_CHAR_TX_UUID,
    NORDIC_UART_SERVICE_UUID,
} from '@/services/ble/drivers/nordic-uart.driver';

describe('Industrial Remote Control & BLE Command Suite', () => {
    describe('Nordic UART Command Encoding (ESP32 Bancada M1)', () => {
        it('deve codificar corretamente o comando de PARADA DE EMERGÊNCIA (E-STOP)', () => {
            const cmd = buildNordicUartCommand('emergency_stop');
            expect(cmd).toBe('CMD:ESTOP\n');
        });

        it('deve codificar comando de LIGAR MOTOR (START)', () => {
            const cmd = buildNordicUartCommand('start');
            expect(cmd).toBe('CMD:START\n');
        });

        it('deve codificar comando de DESLIGAR MOTOR (STOP)', () => {
            const cmd = buildNordicUartCommand('stop');
            expect(cmd).toBe('CMD:STOP\n');
        });

        it('deve codificar ajuste de rotação (SET_RPM) com valor nominal e customizado', () => {
            expect(buildNordicUartCommand('set_rpm', { rpm: 1750 })).toBe('CMD:SET_RPM:1750\n');
            expect(buildNordicUartCommand('set_rpm', { rpm: 3600 })).toBe('CMD:SET_RPM:3600\n');
            expect(buildNordicUartCommand('set_rpm', { rpm: 900 })).toBe('CMD:SET_RPM:900\n');
        });

        it('deve codificar comutação de relés auxiliares da bancada', () => {
            expect(buildNordicUartCommand('toggle_relay', { relay_index: 1, relay_state: true })).toBe('CMD:RELAY:1:1\n');
            expect(buildNordicUartCommand('toggle_relay', { relay_index: 2, relay_state: false })).toBe('CMD:RELAY:2:0\n');
        });

        it('deve codificar reset de alarmes e falhas', () => {
            const cmd = buildNordicUartCommand('reset_alarm');
            expect(cmd).toBe('CMD:RESET\n');
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
