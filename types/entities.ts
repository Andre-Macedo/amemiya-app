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

export type Station = {
    id: string;
    name: string;
    location: string
}


export type Instrument = {
    id: string;
    name: string;
    serial_number: string;
    stock_number: string;
    instrument_type: string;
    status: 'Ativo' | 'Vencido' | 'Em Calibração' | 'Desconhecido';
    station: Station;

    location?: string;
    precision?: string;

    calibrations?: Calibration[];
};

export type InstrumentStatusType = 'active' | 'expired' | 'in_calibration' | 'maintenance' | 'rejected';

// Adicione ao final do arquivo
export type ChecklistItem = {
    id: string;
    step: string;
    question_type: 'numeric' | 'text' | 'boolean' | 'header'; // header para títulos de seção
    order: number;
    required_readings: number;
};

export type ChecklistTemplate = {
    id: string;
    name: string;
    items: ChecklistItem[];
};