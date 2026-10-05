/**
 * Estruturas de dados e entidades metrológicas e industriais da aplicação Amemiya.
 */

export type User = {
    id: number;
    name: string;
    email: string;
};

export type CalibrationResult = 'approved' | 'rejected' | 'approved_with_restrictions';

export type Calibration = {
    id: string;
    checklist_id?: string;
    calibration_date: string;
    result: string;
    notes?: string;
    performed_by: string;
    deviation?: number;
    uncertainty?: number;
    as_found_deviation?: number;
    as_left_deviation?: number;
    certificate_hash?: string;
};

export type Station = {
    id: string;
    name: string;
    code?: string;
    location: string;
    type?: string;
    description?: string;
    instruments_count?: number;
    sensors_count?: number;
};

export type InstrumentStatusType = 'active' | 'expired' | 'in_calibration' | 'maintenance' | 'rejected';

export type Instrument = {
    id: string;
    name: string;
    serial_number: string;
    stock_number?: string;
    instrument_type: string;
    status: 'Ativo' | 'Vencido' | 'Em Calibração' | 'Desconhecido' | InstrumentStatusType;
    station?: Station;
    location?: string;
    precision?: string;
    resolution?: number;
    range_min?: number;
    range_max?: number;
    default_checklist_template?: {
        id: string;
        name: string;
        version?: number;
        items_count?: number;
    };
    calibrations?: Calibration[];
};

export type ChecklistItem = {
    id: string;
    step: string;
    question_type: 'numeric' | 'text' | 'boolean' | 'header';
    order: number;
    required_readings: number;
    nominal_value?: number;
    tolerance_plus?: number;
    tolerance_minus?: number;
    nominal_unit?: string;
};

export type ChecklistTemplate = {
    id: string;
    name: string;
    items: ChecklistItem[];
};

/**
 * Payload completo enviado para POST /api/v1/metrology/calibrations
 * Alinhado rigorosamente com StoreCalibrationRequest.php do backend Laravel.
 */
export interface CalibrationSubmissionPayload {
    instrument_id: string;
    checklist_template_id: string;
    provider_id?: string | null;
    calibration_date: string;
    result: CalibrationResult;
    password: string; // Obrigatório para Assinatura Eletrônica CFR 21 Part 11
    notes?: string;
    deviation: number;
    uncertainty: number;
    as_found_deviation?: number;
    as_left_deviation?: number;
    as_found_result?: string;
    as_left_result?: string;
    environment: {
        temperature: number;
        humidity: number;
    };
    items: Array<{
        item_id: string;
        readings?: number[] | null;
        as_found_readings?: number[] | null;
        as_left_readings?: number[] | null;
        adjusted?: boolean;
        result?: 'approved' | 'rejected' | null;
        notes?: string | null;
        reference_standard_id?: string | number | null;
    }>;
}

// --- ENTIDADES IOT & IHM INDUSTRIAL ---

export type ISO20816Severity = 'A' | 'B' | 'C' | 'D'; // A: Excelente, B: Bom, C: Alerta, D: Perigo

export interface IoTNode {
    id: string;
    name: string;
    mac_address?: string;
    status: 'online' | 'offline' | 'warning' | 'error';
    battery_level?: number;
    rssi?: number;
    gateway_id?: string;
    station_id?: string;
    last_seen_at?: string;
    latest_telemetry?: {
        temperature?: number;
        humidity?: number;
        pressure?: number;
        vibration_rms?: number;
        iso20816_severity?: ISO20816Severity;
        ml_anomaly_probability?: number;
        created_at?: string;
    };
}

export interface IoTGateway {
    id: string;
    name: string;
    ip_address?: string;
    status: 'online' | 'offline';
    last_ping_at?: string;
    nodes_count?: number;
    nodes?: IoTNode[];
}

export interface IoTHistoryPoint {
    timestamp: string;
    temperature?: number;
    humidity?: number;
    vibration_rms?: number;
    accel_x?: number;
    accel_y?: number;
    accel_z?: number;
    ml_anomaly_score?: number;
}