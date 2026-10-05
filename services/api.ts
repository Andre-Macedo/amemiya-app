import axios from 'axios';
import { getStorageItem } from "@/services/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-ID': 'amemiya',
    },
});

// Interceptor para adicionar o Token e manter o cabeçalho de Tenant
api.interceptors.request.use(async (config) => {
    try {
        const token = await getStorageItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const storedUser = await getStorageItem('user_data');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user?.tenant_slug || user?.tenant_id) {
                config.headers['X-Tenant-ID'] = user.tenant_slug || user.tenant_id;
            }
        }
    } catch (error) {
        console.log("Erro ao recuperar token/tenant:", error);
    }
    return config;
});