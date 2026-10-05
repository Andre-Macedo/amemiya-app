import { api } from './api';
import { Station, Instrument, IoTNode } from '@/types/entities';

export const stationApi = {
    getStations: async () => {
        const { data } = await api.get<{ data: Station[] }>('/stations');
        return data.data;
    },

    getStationDetails: async (stationId: string) => {
        const { data } = await api.get<{ data: Station }>(`/stations/${stationId}`);
        return data.data;
    },
};
