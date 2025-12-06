// utils/status-helper.ts
import { Colors } from '@/constants/theme';
import { InstrumentStatusType } from '@/types/entities';

// Mapa de Tradução
export const STATUS_LABELS: Record<InstrumentStatusType, string> = {
    active: 'Ativo',
    expired: 'Vencido',
    in_calibration: 'Em Calibração',
    maintenance: 'Em Manutenção',
    rejected: 'Reprovado',
};

// Mapa de Cores (Semânticas)
export const getStatusColor = (status: InstrumentStatusType, theme: 'light' | 'dark' = 'light') => {
    const colors = Colors[theme];

    switch (status) {
        case 'active':
            return colors.success;
        case 'expired':
        case 'rejected':
            return colors.danger;
        case 'in_calibration':
        case 'maintenance':
            return colors.warning;
        default:
            return colors.textSecondary;
    }
};