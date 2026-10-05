import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useIoTGateways } from '@/hooks/use-iot';
import { IoTGateway } from '@/types/entities';

export default function IoTNetworkTopologyScreen() {
    const router = useRouter();
    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const { data: gateways = [], isLoading, refetch } = useIoTGateways();

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Topologia da Rede IoT" />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={primary} />
                </View>
            ) : (
                <FlatList
                    data={gateways}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    renderItem={({ item }: { item: IoTGateway }) => {
                        const isOnline = item.status === 'online';
                        return (
                            <View style={[styles.gatewayCard, { backgroundColor: cardBg, borderColor: border }]}>
                                {/* Header do Gateway */}
                                <View style={styles.gwHeader}>
                                    <View style={styles.gwIconRow}>
                                        <Ionicons name="hardware-chip-outline" size={24} color={primary} />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={[styles.gwTitle, { color: text }]}>{item.name}</Text>
                                            <Text style={[styles.gwSubtitle, { color: textSec }]}>
                                                IP: {item.ip_address || 'DHCP'} • {item.nodes_count ?? (item.nodes?.length ?? 0)} nós
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#34C75922' : '#FF3B3022' }]}>
                                        <Text style={[styles.statusText, { color: isOnline ? '#34C759' : '#FF3B30' }]}>
                                            {isOnline ? 'Online' : 'Offline'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Lista de Nós Conectados */}
                                {item.nodes && item.nodes.length > 0 && (
                                    <View style={styles.nodesSection}>
                                        <Text style={[styles.nodesSectionTitle, { color: textSec }]}>Nós Conectados:</Text>
                                        {item.nodes.map(node => (
                                            <View key={node.id} style={styles.nodeRow}>
                                                <Ionicons name="git-commit-outline" size={16} color={primary} />
                                                <Text style={[styles.nodeName, { color: text }]}>{node.name}</Text>
                                                <Text style={[styles.nodeRssi, { color: textSec }]}>
                                                    {node.battery_level ? `${node.battery_level}% bat` : ''} {node.rssi ? `• ${node.rssi} dBm` : ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: textSec }]}>
                            Nenhum Gateway configurado na rede.
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
    gatewayCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        elevation: 2,
    },
    gwHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gwIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gwTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    gwSubtitle: {
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
        fontSize: 12,
    },
    nodesSection: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#0000000a',
    },
    nodesSectionTitle: {
        fontFamily: Fonts.sans,
        fontSize: 11,
        marginBottom: 6,
    },
    nodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        gap: 6,
    },
    nodeName: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        flex: 1,
    },
    nodeRssi: {
        fontFamily: Fonts.sans,
        fontSize: 11,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
});
