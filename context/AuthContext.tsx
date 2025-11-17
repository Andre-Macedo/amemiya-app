import React, { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react';
import { User } from '@/types/entities';

interface AuthContextData {
    user: User | null;
    isSessionLoading: boolean;
    isLoginLoading: boolean;
    login: (email: string, password: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData | null>(null);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(true); // Start true

    useEffect(() => {
        setTimeout(() => {
            setUser(null);
            setIsSessionLoading(false);
        }, 200);
    }, []);

    const login = (email: string, password: string) => {
        setIsLoginLoading(true);
        setTimeout(() => {
            setUser({ id: 1, name: 'Técnico Exemplo', email: email });
            setIsLoginLoading(false);
        }, 1000);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isSessionLoading,
                isLoginLoading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};