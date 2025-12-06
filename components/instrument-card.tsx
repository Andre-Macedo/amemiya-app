import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Instrument } from '@/types/entities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {Ionicons} from "@expo/vector-icons";

type InstrumentStatus = 'active' | 'expired' | 'in_calibration' ;

const getStatusThemeKey = (status: InstrumentStatus): 'success' | 'danger' | 'warning' | 'textSecondary' => {
    switch (status) {
        case 'active':
            return 'success';
        case 'expired':
            return 'danger';
        case 'in_calibration':
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
    const detailBoldColor = useThemeColor({}, 'text');

    const statusThemeKey = getStatusThemeKey(item.status);
    const statusBadgeColor = useThemeColor({}, statusThemeKey);

    const theme = useColorScheme() ?? 'light';

    const statusTextColor = theme === 'light' ? '#FFFFFF' : '#1A202C';
    const cardBg = useThemeColor({}, 'white');

    // Pega a cor baseada no status
    const statusKey = getStatusThemeKey(item.status);
    const statusColor = useThemeColor({}, statusKey);

    const handleCalibrate = () => {
        // Navega para a tela de calibração PASSANDO O PARÂMETRO
        router.push({
            pathname: '/(app)/calibration', // Ajuste para sua rota real
            params: { preselectedInstrumentId: item.id }
        });
    };

    return (
        <Link href={`/instruments/${item.id}`} asChild>
            <Pressable
                style={({ pressed }) => [
                    styles.container,
                    { opacity: pressed ? 0.7 : 1 } // Feedback tátil visual
                ]}
            >
                <View style={[styles.instrumentCard, { backgroundColor: cardBg }]}>
                    {/* Barra lateral colorida */}
                    <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

                    <View style={styles.contentContainer}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.instrumentName, { color: titleColor }]}>
                                {item.name}
                            </Text>
                            {/* Opcional: Manter o badge ou usar apenas a cor */}
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="barcode-outline" size={14} color={detailColor} />
                            <Text style={[styles.infoText, { color: detailColor }]}> {item.stock_number}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={14} color={detailColor} />
                            <Text style={[styles.infoText, { color: detailColor }]}> {item.station.name || 'Sem local'}</Text>
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
        borderRadius: 12,
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    instrumentCard: {
        borderRadius: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        paddingRight: 16,
        minHeight: 100,
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    headerRow: {
        marginBottom: 6,
    },
    instrumentName: {
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    infoText: {
        fontSize: 13,
        fontFamily: Fonts.sans,
    }
});
