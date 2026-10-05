import { useQuery } from '@tanstack/react-query';
import { machineApi } from '@/services/machine-api';

export function useMachines() {
    return useQuery({
        queryKey: ['machines'],
        queryFn: () => machineApi.getMachines(),
    });
}

export function useMachineDetails(machineId: string | undefined) {
    return useQuery({
        queryKey: ['machine-details', machineId],
        queryFn: () => (machineId ? machineApi.getMachineDetails(machineId) : null),
        enabled: !!machineId,
    });
}
