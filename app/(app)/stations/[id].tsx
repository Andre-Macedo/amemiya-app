import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useStationDetails } from '@/hooks/use-stations';
import { SensorIhmCard } from '@/components/iot/sensor-ihm-card';

export default function StationDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const { data: station, isLoading } = useStationDetails(id);

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    if (!station) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ScreenHeader title="Máquina" showBack />
                <Text style={{ color: textSec, marginTop: 20 }}>Estação não encontrada.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={station.name} showBack />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Header da Máquina */}
                <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.title, { color: text }]}>{station.name}</Text>
                    <Text style={[styles.desc, { color: textSec }]}>
                        {station.description || 'Estação industrial de manufatura ou bancada de calibração.'}
                    </Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: primary + '15' }]}>
                            <Text style={[styles.badgeText, { color: primary }]}>
                                {station.location || 'Fábrica'}
                            </Text>
                        </View>
                        {station.type && (
                            <View style={[styles.badge, { backgroundColor: '#34C75915' }]}>
                                <Text style={[styles.badgeText, { color: '#34C759' }]}>
                                    Tipo: {station.type}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Seção: Sensores IoT Instalados */}
                <Text style={[styles.sectionTitle, { color: text }]}>
                    Sensores IoT Instalados ({station.nodes?.length ?? 0})
                </Text>
                {station.nodes && station.nodes.length > 0 ? (
                    station.nodes.map(node => (
                        <SensorIhmCard
                            key={node.id}
                            node={node}
                            onPress={() => router.push(`/iot/${node.id}` as any)}
                        />
                    ))
                ) : (
                    <Text style={[styles.emptySection, { color: textSec }]}>
                        Nenhum sensor IoT vinculado a esta máquina.
                    </Text>
                )}

                {/* Seção: Instrumentos Alocados */}
                <Text style={[styles.sectionTitle, { color: text, marginTop: 24 }]}>
                    Instrumentos na Máquina ({station.instruments?.length ?? 0})
                </Text>
                {station.instruments && station.instruments.length > 0 ? (
                    station.instruments.map(inst => (
                        <Pressable
                            key={inst.id}
                            style={[styles.instCard, { backgroundColor: cardBg, borderColor: border }]}
                            onPress={() => router.push(`/instruments/${inst.id}`)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.instName, { color: text }]}>{inst.name}</Text>
                                <Text style={[styles.instSerial, { color: textSec }]}>
                                    Nº: {inst.stock_number || inst.serial_number} • {inst.instrument_type}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={textSec} />
                        </Pressable>
                    ))
                ) : (
                    <Text style={[styles.emptySection, { color: textSec }]}>
                        Nenhum instrumento alocado nesta estação.
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 16,
    },
    infoCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        elevation: 2,
    },
    title: {
        fontFamily: Fonts.sansBold,
        fontSize: 20,
    },
    desc: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        marginTop: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
    },
    sectionTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        marginBottom: 10,
    },
    emptySection: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    instCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
    },
    instName: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    instSerial: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
    },
});
