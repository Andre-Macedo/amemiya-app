import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Instrument } from '@/types/entities';

type InstrumentsResponse = {
    data: Instrument[];
    meta: {
        current_page: number;
        last_page: number;
    };
};

// Hook para Lista Paginada com Filtros
export function useInstruments(status: string, search: string) {
    return useInfiniteQuery({
        queryKey: ['instruments', status, search],
        queryFn: async ({ pageParam = 1 }) => {
            const params: any = { page: pageParam };

            // Adiciona filtros se existirem
            if (status !== 'Todos') params.status = status;
            if (search.length > 0) params.search = search;

            const { data } = await api.get<InstrumentsResponse>('/instruments', { params });
            return data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.current_page < lastPage.meta.last_page) {
                return lastPage.meta.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });
}

// Hook para Detalhes de um Instrumento
export function useInstrument(id: string) {
    return useQuery({
        queryKey: ['instrument', id],
        queryFn: async () => {
            const { data } = await api.get<{ data: Instrument }>(`/instruments/${id}`);
            return data.data;
        },
        enabled: !!id, // Só roda se tiver ID
    });
}


export interface DashboardStats {
    kpi?: {
        total_instruments: number;
        total_standards?: number;
        active_count: number;
        overdue_count: number;
        in_calibration_count: number;
        compliance_rate: number;
    };
    total_instruments?: number;
    total_standards?: number;
    active_count?: number;
    overdue_count?: number;
    calibration_count?: number;
    in_calibration_count?: number;
    compliance_rate?: number;
    upcoming_due?: Array<{
        id: string;
        name: string;
        serial_number: string;
        calibration_due: string;
        status: string;
    }>;
    recent_calibrations?: Array<{
        id: string;
        item_name: string;
        result: string;
        date: string;
        certificate?: string;
    }>;
}

// Hook para o Dashboard
export function useDashboardStats() {
    return useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            try {
                const { data } = await api.get<DashboardStats>('/dashboard/stats');
                return data;
            } catch (err: any) {
                console.warn('[useDashboardStats] Falha ao buscar estatísticas do dashboard:', err?.response?.status, err?.message);
                throw err;
            }
        },
        staleTime: 1000 * 5,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
}