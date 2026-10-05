import { getStorageItem, saveStorageItem, removeStorageItem } from '@/services/storage';
import { PairedBleDevice } from './ble-types';

const PAIRED_DEVICES_STORAGE_KEY = 'amemiya_paired_ble_devices';

export async function getPairedBleDevices(): Promise<PairedBleDevice[]> {
    try {
        const raw = await getStorageItem(PAIRED_DEVICES_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function savePairedBleDevice(device: PairedBleDevice): Promise<void> {
    const list = await getPairedBleDevices();
    const existingIndex = list.findIndex(d => d.id === device.id);
    if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], ...device, lastConnectedAt: Date.now() };
    } else {
        list.push({ ...device, lastConnectedAt: Date.now() });
    }
    await saveStorageItem(PAIRED_DEVICES_STORAGE_KEY, JSON.stringify(list));
}

export async function removePairedBleDevice(deviceId: string): Promise<void> {
    const list = await getPairedBleDevices();
    const filtered = list.filter(d => d.id !== deviceId);
    await saveStorageItem(PAIRED_DEVICES_STORAGE_KEY, JSON.stringify(filtered));
}
