import { useQuery } from '@tanstack/react-query';
import { stationApi } from '@/services/station-api';

export function useStations() {
    return useQuery({
        queryKey: ['stations'],
        queryFn: () => stationApi.getStations(),
    });
}

export function useStationDetails(stationId: string | undefined) {
    return useQuery({
        queryKey: ['station-details', stationId],
        queryFn: () => (stationId ? stationApi.getStationDetails(stationId) : null),
        enabled: !!stationId,
    });
}
