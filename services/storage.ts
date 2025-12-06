import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function saveStorageItem(key: string, value: string) {
    if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, value);
        }
    } else {
        await SecureStore.setItemAsync(key, value);
    }
}

export async function getStorageItem(key: string) {
    if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(key);
        }
        return null;
    } else {
        return await SecureStore.getItemAsync(key);
    }
}

export async function removeStorageItem(key: string) {
    if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
        }
    } else {
        await SecureStore.deleteItemAsync(key);
    }
}