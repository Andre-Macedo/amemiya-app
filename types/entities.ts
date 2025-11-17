/**
 * Define as estruturas de dados (entidades) da nossa aplicação.
 */

export type User = {
    id: number;
    name: string;
    email: string;
};

export type Calibration = {
    id: string;
    checklist_id: string;
    calibration_date: string;
    result: 'Aprovado' | 'Reprovado' | 'Em Andamento';
    notes?: string;
    performed_by: string;
};


export type Instrument = {
    id: string;
    name: string;
    serial_number: string;
    instrument_type: string;
    status: 'Ativo' | 'Vencido' | 'Em Calibração' | 'Desconhecido';

    location?: string;
    precision?: string;

    calibrations?: Calibration[];
};