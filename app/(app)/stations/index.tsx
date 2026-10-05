import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useStations } from '@/hooks/use-stations';
import { Station } from '@/types/entities';

export default function StationsListScreen() {
    const router = useRouter();
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const { data: stations = [], isLoading, refetch } = useStations();

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Postos de Trabalho & Células" />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={primary} />
                </View>
            ) : (
                <FlatList
                    data={stations}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    renderItem={({ item }: { item: Station }) => (
                        <Pressable
                            style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
                            onPress={() => router.push(`/stations/${item.id}` as any)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="business-outline" size={24} color={primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.name, { color: text }]}>{item.name}</Text>
                                    <Text style={[styles.location, { color: textSec }]}>
                                        {item.location || 'Linha Principal'} {item.code ? `• Cód: ${item.code}` : ''}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={textSec} />
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="cog-outline" size={14} color={textSec} />
                                    <Text style={[styles.statText, { color: textSec }]}>
                                        {item.machines_count ?? 0} máquinas
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="construct-outline" size={14} color={textSec} />
                                    <Text style={[styles.statText, { color: textSec }]}>
                                        {item.instruments_count ?? 0} instrumentos
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="hardware-chip-outline" size={14} color={textSec} />
                                    <Text style={[styles.statText, { color: textSec }]}>
                                        {item.sensors_count ?? 0} IoT
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: textSec }]}>
                            Nenhum posto de trabalho ou célula cadastrado.
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
    card: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#007AFF15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    location: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#0000000a',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontFamily: Fonts.sans,
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
});
