import { Instrument } from '@/types/entities';

// Dados falsos (mock) para o protótipo.
export const DUMMY_INSTRUMENTS: Instrument[] = [
    {
        id: '1',
        name: 'Paquímetro Digital',
        serial_number: 'PKD-2023-001',
        instrument_type: 'Medição Dimensional',
        status: 'Ativo',
        location: 'Bancada 01',
        precision: '0.01mm',
        calibrations: [
            { id: 'c1', checklist_id: 'chk1', calibration_date: '2024-05-15', result: 'Aprovado', performed_by: 'Técnico Exemplo' },
            { id: 'c2', checklist_id: 'chk2', calibration_date: '2023-05-14', result: 'Aprovado', performed_by: 'Técnico Exemplo' },
        ]
    },
    {
        id: '2',
        name: 'Micrômetro Externo',
        serial_number: 'MIC-2022-045',
        instrument_type: 'Medição Dimensional',
        status: 'Vencido',
        location: 'Bancada 02',
        precision: '0.001mm',
        calibrations: [
            { id: 'c3', checklist_id: 'chk3', calibration_date: '2023-10-20', result: 'Aprovado', performed_by: 'Técnico Exemplo' }
        ]
    },
    {
        id: '3',
        name: 'Multímetro Digital',
        serial_number: 'MLT-2023-012',
        instrument_type: 'Medição Elétrica',
        status: 'Em Calibração',
        location: 'Laboratório Elétrico',
        precision: '0.1V',
        calibrations: [
            { id: 'c4', checklist_id: 'chk4', calibration_date: '2024-11-10', result: 'Em Andamento', performed_by: 'Técnico Exemplo' }
        ]
    },
    {
        id: '4',
        name: 'Termômetro Digital',
        serial_number: 'TRM-2023-007',
        instrument_type: 'Medição de Temperatura',
        status: 'Ativo',
        location: 'Estufa 03',
        precision: '0.1°C',
        calibrations: []
    },
];