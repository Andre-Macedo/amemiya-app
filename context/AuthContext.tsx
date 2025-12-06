import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { api } from '@/services/api';
import { User } from '@/types/entities';
import { router } from 'expo-router';
import { getStorageItem, removeStorageItem, saveStorageItem } from '@/services/storage'; // <--- Importe o helper

interface AuthContextData {
    user: User | null;
    isSessionLoading: boolean;
    isLoginLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            try {
                const token = await getStorageItem(TOKEN_KEY);
                const storedUser = await getStorageItem(USER_KEY);

                if (token && storedUser) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.log('Erro ao carregar sessão:', error);
            } finally {
                setIsSessionLoading(false);
            }
        }

        loadStorageData();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoginLoading(true);
        try {
            // 1. Request
            const response = await api.post('/login', { email, password });

            // 2. Dados
            const { token, user } = response.data;

            // 3. Salvar (Agora seguro para Web e Mobile)
            await saveStorageItem(TOKEN_KEY, token);
            await saveStorageItem(USER_KEY, JSON.stringify(user));

            // 4. Configurar Axios
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // 5. Atualizar Estado
            setUser(user);

            // Opcional: Redirecionar forçado se o _layout não pegar
            // router.replace('/');

        } catch (error: any) {
            console.error("Erro Completo no Login:", error); // Veja isso no terminal se der erro

            // Tenta pegar a mensagem do backend, senão usa a do erro genérico
            const msg = error.response?.data?.message || error.message || 'Verifique suas credenciais.';
            alert(`Erro no Login: ${msg}`);
        } finally {
            setIsLoginLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.log('Erro no logout da API', error);
        } finally {
            await removeStorageItem(TOKEN_KEY);
            await removeStorageItem(USER_KEY);
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            router.replace('/(auth)/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, isSessionLoading, isLoginLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    return context;
};