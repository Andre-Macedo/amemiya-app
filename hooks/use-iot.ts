import { useQuery } from '@tanstack/react-query';
import { iotApi } from '@/services/iot-api';

export function useIoTNodes(stationId?: string) {
    return useQuery({
        queryKey: ['iot-nodes', stationId],
        queryFn: () => iotApi.getNodes(stationId),
        refetchInterval: 15000, // Atualiza a cada 15s para monitoramento em tempo real
    });
}

export function useIoTNodeDetails(nodeId: string | undefined) {
    return useQuery({
        queryKey: ['iot-node-details', nodeId],
        queryFn: () => (nodeId ? iotApi.getNodeDetails(nodeId) : null),
        enabled: !!nodeId,
        refetchInterval: 10000,
    });
}

export function useIoTNodeHistory(nodeId: string | undefined, period: '1h' | '6h' | '24h' | '7d' = '24h') {
    return useQuery({
        queryKey: ['iot-node-history', nodeId, period],
        queryFn: () => (nodeId ? iotApi.getNodeHistory(nodeId, period) : []),
        enabled: !!nodeId,
    });
}

export function useIoTGateways() {
    return useQuery({
        queryKey: ['iot-gateways'],
        queryFn: () => iotApi.getGateways(),
        refetchInterval: 30000,
    });
}
