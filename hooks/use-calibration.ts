import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ChecklistTemplate } from '@/types/entities';

// Hook 1: Listar opções de procedimentos
export function useAvailableChecklists(instrumentId: string | undefined) {
    return useQuery({
        queryKey: ['available-checklists', instrumentId],
        queryFn: async () => {
            if (!instrumentId) return [];
            // Retorna lista simplificada: [{id, name}, ...]
            const { data } = await api.get<{ data: { id: string, name: string }[] }>(`/instruments/${instrumentId}/checklists`);
            return data.data;
        },
        enabled: !!instrumentId,
    });
}

// Hook 2: Pegar o formulário completo
export function useChecklistDetails(templateId: string | undefined) {
    return useQuery({
        queryKey: ['checklist-details', templateId],
        queryFn: async () => {
            if (!templateId) return null;
            const { data } = await api.get<{ data: ChecklistTemplate }>(`/checklists/${templateId}`);
            return data.data;
        },
        enabled: !!templateId,
    });
}