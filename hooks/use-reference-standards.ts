import { useQuery } from '@tanstack/react-query';
import {api} from "@/services/api";

export interface InstrumentOption {
    id: number;
    name: string;
    serial_number: string;
    instrument_type_id: number;
}

export interface ReferenceStandard {
    id: number;
    name: string;
    serial_number?: string;
    stock_number?: string;
    nominal_value?: number;
    effective_serial_number?: string;
    effective_stock_number?: string;
    parent_id?: number | null;
    children?: ReferenceStandard[];
}

interface CalibrationOptionsResponse {
    kits: ReferenceStandard[];
    standards: ReferenceStandard[]; // <--- Nova lista achatada
    instruments: InstrumentOption[];
}
const fetchCalibrationOptions = async (): Promise<CalibrationOptionsResponse> => {
    // Chama o endpoint que criamos no Laravel
    const { data } = await api.get('/metrology/options');
    return data;
};

export function useCalibrationOptions() {
    return useQuery({
        queryKey: ['calibration-options'],
        queryFn: fetchCalibrationOptions,
        staleTime: 1000 * 60 * 5,
    });
}

// Hook auxiliar atualizado
export function useReferenceStandards() {
    const { data, ...rest } = useCalibrationOptions();
    return {
        kits: data?.kits || [],
        allStandards: data?.standards || [], // <--- Expomos a lista completa
        ...rest
    };
}