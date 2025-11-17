import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Instrument } from '@/types/entities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type InstrumentStatus = 'Ativo' | 'Vencido' | 'Em Calibração' | 'Desconhecido';

const getStatusThemeKey = (status: InstrumentStatus): 'success' | 'danger' | 'warning' | 'textSecondary' => {
    switch (status) {
        case 'Ativo':
            return 'success';
        case 'Vencido':
            return 'danger';
        case 'Em Calibração':
            return 'warning';
        default:
            return 'textSecondary';
    }
};

interface InstrumentCardProps {
    item: Instrument;
}

const InstrumentCard: React.FC<InstrumentCardProps> = ({ item }) => {

    const cardBg = useThemeColor({}, 'white');
    const titleColor = useThemeColor({}, 'text');
    const detailColor = useThemeColor({}, 'textSecondary');
    const detailBoldColor = useThemeColor({}, 'text');

    const statusThemeKey = getStatusThemeKey(item.status);
    const statusBadgeColor = useThemeColor({}, statusThemeKey);

    const theme = useColorScheme() ?? 'light';

    const statusTextColor = theme === 'light' ? '#FFFFFF' : '#1A202C';
    return (
        <Link href={`/instruments/${item.id}`} asChild>
            <Pressable>
                <View style={[styles.instrumentCard, { backgroundColor: cardBg }]}>
                    <View style={styles.instrumentCardHeader}>
                        <Text style={[styles.instrumentName, { color: titleColor }]}>
                            {item.name}
                        </Text>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: statusBadgeColor }, // Cor de fundo dinâmica
                            ]}
                        >
                            <Text style={[styles.statusText, { color: statusTextColor }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.instrumentDetail, { color: detailColor }]}>
                        Série: <Text style={[styles.instrumentDetailBold, { color: detailBoldColor }]}>{item.serial_number}</Text>
                    </Text>
                    <Text style={[styles.instrumentDetail, { color: detailColor }]}>
                        Tipo: <Text style={[styles.instrumentDetailBold, { color: detailBoldColor }]}>{item.instrument_type}</Text>
                    </Text>
                </View>
            </Pressable>
        </Link>
    );
};

export default InstrumentCard;

const styles = StyleSheet.create({
    instrumentCard: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    instrumentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    instrumentName: {
        fontSize: 18,
        fontFamily: Fonts.sansBold,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.sansSemiBold,
    },
    instrumentDetail: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        marginBottom: 5,
    },
    instrumentDetailBold: {
        fontFamily: Fonts.sansSemiBold,
    },
});