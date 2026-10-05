import { api } from './api';
import { Machine, Station, IoTNode } from '@/types/entities';

export const machineApi = {
    getMachines: async () => {
        const { data } = await api.get<{ data: Machine[] }>('/machines');
        return data.data;
    },

    getMachineDetails: async (machineId: string) => {
        const { data } = await api.get<{
            data: Machine & {
                station?: Station;
                nodes?: IoTNode[];
            };
        }>(`/machines/${machineId}`);
        return data.data;
    },
};
