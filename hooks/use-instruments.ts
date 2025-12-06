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


// Hook para o Dashboard
export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        }
    });
}