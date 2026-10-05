import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useIoTNodes } from '@/hooks/use-iot';
import { SensorIhmCard } from '@/components/iot/sensor-ihm-card';

export default function IoTNodesListScreen() {
    const router = useRouter();
    const bg = useThemeColor({}, 'background');
    const primary = useThemeColor({}, 'primary');
    const textSec = useThemeColor({}, 'textSecondary');

    const { data: nodes = [], isLoading, refetch } = useIoTNodes();

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Sensores IoT & IHM" />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={primary} />
                </View>
            ) : (
                <FlatList
                    data={nodes}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    renderItem={({ item }) => (
                        <SensorIhmCard
                            node={item}
                            onPress={() => router.push(`/iot/${item.id}` as any)}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: textSec }]}>
                            Nenhum nó de sensor registrado na rede.
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
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
});
