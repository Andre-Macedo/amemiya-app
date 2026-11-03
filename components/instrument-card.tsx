import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Instrument } from '@/types/entities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from "@expo/vector-icons";

const getStatusThemeKey = (status: any): 'success' | 'danger' | 'warning' | 'textSecondary' => {
    switch (status) {
        case 'active':
        case 'Ativo':
            return 'success';
        case 'expired':
        case 'Vencido':
        case 'rejected':
        case 'Reprovado':
            return 'danger';
        case 'in_calibration':
        case 'Em Calibração':
        case 'maintenance':
        case 'Em Manutenção':
            return 'warning';
        default:
            return 'textSecondary';
    }
};

interface InstrumentCardProps {
    item: Instrument;
}

const InstrumentCard: React.FC<InstrumentCardProps> = ({ item }) => {
    const titleColor = useThemeColor({}, 'text');
    const detailColor = useThemeColor({}, 'textSecondary');

    const statusThemeKey = getStatusThemeKey(item.status);
    const statusBadgeColor = useThemeColor({}, statusThemeKey);
    const cardBg = useThemeColor({}, 'white');

    return (
        <Link href={`/instruments/${item.id}`} asChild>
            <Pressable
                style={({ pressed }) => [
                    styles.container,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
            >
                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <View style={styles.topRow}>
                        <Text style={[styles.name, { color: titleColor }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: statusBadgeColor }]}>
                            <Text style={styles.badgeText}>{item.status}</Text>
                        </View>
                    </View>

                    <Text style={[styles.type, { color: detailColor }]}>
                        {item.instrument_type}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.bottomRow}>
                        <View style={styles.infoRow}>
                            <Ionicons name="barcode-outline" size={14} color={detailColor} />
                            <Text style={[styles.infoText, { color: detailColor }]}> {item.stock_number || item.serial_number}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={14} color={detailColor} />
                            <Text style={[styles.infoText, { color: detailColor }]}> {item.station?.name || item.location || 'Sem local'}</Text>
                        </View>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={detailColor} style={{ alignSelf: 'center' }} />
                </View>
            </Pressable>
        </Link>
    );
};

export default InstrumentCard;

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
    },
    type: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#0000000a',
        marginBottom: 12,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontFamily: Fonts.sans,
        fontSize: 12,
    },
});
