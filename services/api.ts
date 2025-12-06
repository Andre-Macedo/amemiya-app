import axios from 'axios';
import {getStorageItem} from "@/services/storage";

const API_URL = 'https://leantech.andremacedo.dev.br/api/v1';
// const API_URL = 'https//localhost:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para adicionar o Token
api.interceptors.request.use(async (config) => {
    try {
        const token = await getStorageItem('auth_token'); // <--- Uso do helper
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.log("Erro ao pegar token:", error);
    }
    return config;
});