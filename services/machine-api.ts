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

    sendCommand: async (
        machineId: string,
        params: {
            command:
                | 'silence_buzzer'
                | 'reset_alarm'
                | 'test_buzzer'
                | 'emergency_stop'
                | 'start'
                | 'stop'
                | 'set_rpm'
                | 'toggle_relay'
                | 'set_alarm_state'
                | string;
            rpm?: number;
            relay_index?: number;
            relay_state?: boolean;
            state?: string;
            reason?: string;
        }
    ) => {
        const { data } = await api.post<{
            success: boolean;
            message: string;
            command_id: string;
            command: string;
            machine_status: string;
            topics?: string[];
            dispatched_at: string;
        }>(`/machines/${machineId}/command`, params);
        return data;
    },
};
