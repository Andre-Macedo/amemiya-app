import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMachines } from '@/hooks/use-machines';
import { MachineHmiPanel } from '@/components/iot/machine-hmi-panel';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';

export default function MachinesListScreen() {
    const router = useRouter();
    const bg = useThemeColor({}, 'background');
    const primary = useThemeColor({}, 'primary');
    const textSec = useThemeColor({}, 'textSecondary');
    const text = useThemeColor({}, 'text');

    const { data: machines = [], isLoading, refetch } = useMachines();

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={'Máquinas & IHM (3.5")'} />

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
                    ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => router.push(`/machines/${item.id}` as any)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1.0 }]}
                        >
                            <MachineHmiPanel
                                machine={item}
                                nodes={[]} // carregado sob demanda ou via show
                            />
                            <View style={styles.openDetailHint}>
                                <Text style={[styles.openDetailText, { color: primary }]}>
                                    Toque para abrir telemetria detalhada e especificações
                                </Text>
                                <Ionicons name="arrow-forward" size={13} color={primary} />
                            </View>
                        </Pressable>
                    )}
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
    openDetailHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 6,
    },
    openDetailText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontFamily: Fonts.sans,
        fontSize: 14,
    },
});
