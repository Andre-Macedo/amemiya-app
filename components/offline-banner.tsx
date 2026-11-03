import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { getOutboxQueue, processOutboxQueue } from '@/services/offline-sync';
import * as Haptics from 'expo-haptics';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const refreshQueueCount = useCallback(async () => {
        const queue = await getOutboxQueue();
        setPendingCount(queue.length);
    }, []);

    useEffect(() => {
        refreshQueueCount();

        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            const offline = !(state.isConnected && state.isInternetReachable !== false);
            setIsOffline(offline);

            if (!offline) {
                // Ao recuperar a internet, dispara a sincronização automática
                processOutboxQueue()
                    .then(res => {
                        if (res.succeeded > 0) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        }
                        refreshQueueCount();
                    })
                    .catch(() => {});
            }
        });

        // Intervalo de verificação da fila local
        const interval = setInterval(refreshQueueCount, 8000);

        return () => {
            unsubscribeNetInfo();
            clearInterval(interval);
        };
    }, [refreshQueueCount]);

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            const res = await processOutboxQueue();
            if (res.succeeded > 0) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            await refreshQueueCount();
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isOffline && pendingCount === 0) {
        return null;
    }

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: isOffline ? '#D97706' : '#2563EB' },
            ]}
        >
            <View style={styles.left}>
                <Ionicons
                    name={isOffline ? 'cloud-offline-outline' : 'cloud-upload-outline'}
                    size={18}
                    color="#FFFFFF"
                />
                <Text style={styles.text}>
                    {isOffline
                        ? `Modo Offline${pendingCount > 0 ? ` • ${pendingCount} pendente(s)` : ''}`
                        : `${pendingCount} item(ns) aguardando sincronização`}
                </Text>
            </View>

            {!isOffline && pendingCount > 0 && (
                <Pressable
                    style={styles.syncBtn}
                    onPress={handleManualSync}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.syncBtnText}>Sincronizar</Text>
                    )}
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 99,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    text: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    syncBtn: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    syncBtnText: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 11,
    },
});
