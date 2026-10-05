import { api } from './api';
import { IoTGateway, IoTNode, IoTHistoryPoint } from '@/types/entities';

export const iotApi = {
    getGateways: async () => {
        const { data } = await api.get<{ data: IoTGateway[] }>('/iot-gateways');
        return data.data;
    },

    getNodes: async (stationId?: string) => {
        const params = stationId ? { station_id: stationId } : {};
        const { data } = await api.get<{ data: IoTNode[] }>('/iot-nodes', { params });
        return data.data;
    },

    getNodeDetails: async (nodeId: string) => {
        const { data } = await api.get<{ data: IoTNode }>(`/iot-nodes/${nodeId}`);
        return data.data;
    },

    getNodeHistory: async (nodeId: string, period: '1h' | '6h' | '24h' | '7d' = '24h') => {
        const { data } = await api.get<{ data: IoTHistoryPoint[] }>('/iot-history', {
            params: { node_id: nodeId, period }
        });
        return data.data;
    },
};
