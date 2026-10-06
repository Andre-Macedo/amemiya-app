import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMachines } from '@/hooks/use-machines';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';

export default function MachinesListScreen() {
    const router = useRouter();
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const primary = useThemeColor({}, 'primary');
    const textSec = useThemeColor({}, 'textSecondary');
    const text = useThemeColor({}, 'text');
    const border = useThemeColor({}, 'border');
    const success = useThemeColor({}, 'success');
    const warning = useThemeColor({}, 'warning');

    const { data: machines = [], isLoading, refetch } = useMachines();

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Máquinas Industriais" />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={primary} />
                </View>
            ) : (
                <FlatList
                    data={machines}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
                    renderItem={({ item }) => {
                        const isOperational = item.status === 'operational';

                        return (
                            <View style={[styles.machineCard, { backgroundColor: cardBg, borderColor: border }]}>
                                {/* Header do Card */}
                                <Pressable
                                    onPress={() => router.push(`/machines/${item.id}` as any)}
                                    style={styles.cardHeader}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: primary + '15' }]}>
                                        <Ionicons name="cog" size={24} color={primary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.machineName, { color: text }]}>{item.name}</Text>
                                        <Text style={[styles.machineCode, { color: textSec }]}>
                                            Cód: {item.code || 'S/N'} {item.description ? `• ${item.description}` : ''}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: (isOperational ? success : warning) + '15' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: isOperational ? success : warning },
                                            ]}
                                        >
                                            {isOperational ? 'Operacional' : item.status}
                                        </Text>
                                    </View>
                                </Pressable>

                                {/* Ações: Ver Ficha Técnica & Abrir Terminal IHM */}
                                <View style={[styles.actionsRow, { borderTopColor: border }]}>
                                    <Pressable
                                        style={styles.actionDetailBtn}
                                        onPress={() => router.push(`/machines/${item.id}` as any)}
                                    >
                                        <Text style={[styles.actionDetailText, { color: textSec }]}>
                                            Ver Ficha Técnica
                                        </Text>
                                        <Ionicons name="chevron-forward" size={14} color={textSec} />
                                    </Pressable>

                                    <Pressable
                                        style={styles.actionHmiBtn}
                                        onPress={() => router.push(`/machines/${item.id}/hmi` as any)}
                                    >
                                        <Ionicons name="tv-outline" size={16} color="#00E676" />
                                        <Text style={styles.actionHmiText}>
                                            Terminal IHM (3.5")
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: textSec }]}>
                            Nenhuma máquina industrial registrada no parque fabril.
                        </Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    machineCard: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    machineName: {
        fontFamily: Fonts.sansBold,
        fontSize: 16,
    },
    machineCode: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
        textTransform: 'capitalize',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    actionDetailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionDetailText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    actionHmiBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0F1622',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00E67644',
    },
    actionHmiText: {
        color: '#00E676',
        fontFamily: Fonts.sansBold,
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontFamily: Fonts.sans,
        fontSize: 14,
    },
});
