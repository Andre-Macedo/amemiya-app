import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { api } from './api';
import { Instrument } from '@/types/entities';

const OUTBOX_STORAGE_KEY = '@amemiya_outbox_queue';
const CACHED_INSTRUMENTS_KEY = '@amemiya_cached_instruments';

export interface OutboxItem {
    id: string;
    type: 'calibration' | 'intermediate_check' | 'custody_scan';
    endpoint: string;
    payload: any;
    createdAt: string;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed';
    lastError?: string;
}

/**
 * Retorna todos os itens pendentes na fila outbox.
 */
export async function getOutboxQueue(): Promise<OutboxItem[]> {
    try {
        const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Adiciona uma requisição à fila de sincronização offline.
 */
export async function enqueueOutbox(
    item: Omit<OutboxItem, 'id' | 'createdAt' | 'retryCount' | 'status'>
): Promise<OutboxItem> {
    const queue = await getOutboxQueue();
    const newItem: OutboxItem = {
        ...item,
        id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
    };

    queue.push(newItem);
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
    return newItem;
}

/**
 * Remove um item concluído da fila outbox.
 */
export async function removeOutboxItem(id: string): Promise<void> {
    const queue = await getOutboxQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Atualiza o status de um item na fila outbox.
 */
export async function updateOutboxItem(id: string, updates: Partial<OutboxItem>): Promise<void> {
    const queue = await getOutboxQueue();
    const idx = queue.findIndex(item => item.id === id);
    if (idx >= 0) {
        queue[idx] = { ...queue[idx], ...updates };
        await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
    }
}

/**
 * Processa a fila outbox sequencialmente enviando para a API backend.
 */
export async function processOutboxQueue(): Promise<{ succeeded: number; failed: number }> {
    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) {
        return { succeeded: 0, failed: 0 };
    }

    const queue = await getOutboxQueue();
    let succeeded = 0;
    let failed = 0;

    for (const item of queue) {
        if (item.status === 'syncing') continue;

        await updateOutboxItem(item.id, { status: 'syncing' });

        try {
            await api.post(item.endpoint, item.payload);
            await removeOutboxItem(item.id);
            succeeded++;
        } catch (error: any) {
            failed++;
            await updateOutboxItem(item.id, {
                status: 'failed',
                retryCount: item.retryCount + 1,
                lastError: error?.response?.data?.message || error?.message || 'Falha de conexão',
            });
        }
    }

    return { succeeded, failed };
}

/**
 * Cache local de instrumentos para consulta offline no chão de fábrica.
 */
export async function cacheInstruments(instruments: Instrument[]): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHED_INSTRUMENTS_KEY, JSON.stringify(instruments));
    } catch (e) {
        console.warn('[OfflineSync] Falha ao salvar instrumentos em cache:', e);
    }
}

/**
 * Recupera os instrumentos armazenados no cache local.
 */
export async function getCachedInstruments(): Promise<Instrument[]> {
    try {
        const raw = await AsyncStorage.getItem(CACHED_INSTRUMENTS_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}
