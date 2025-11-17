import { Stack, useLocalSearchParams, useRouter } from 'expo-router'; // 1. Importar useRouter
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable } from 'react-native'; // 2. Importar Pressable
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Calibration, Instrument } from '@/types/entities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme'; // 3. Importar Fonts
import { Ionicons } from '@expo/vector-icons'; // 4. Importar Ionicons

export default function InstrumentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const instrument: Instrument | undefined = DUMMY_INSTRUMENTS.find(inst => inst.id === id);

    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const secondaryText = useThemeColor({}, 'textSecondary');
    const borderColor = useThemeColor({}, 'border');
    const successColor = useThemeColor({}, 'success');
    const dangerColor = useThemeColor({}, 'danger');
    const primaryColor = useThemeColor({}, 'primary');

    const onStartCalibration = () => {
        router.push({
            pathname: '/calibration',
            params: { instrumentId: id }
        });
    };

    if (!instrument) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
                <ThemedText>Instrumento não encontrado.</ThemedText>
            </ThemedView>
        );
    }

    const renderHistoryItem = ({ item }: { item: Calibration }) => (
        <View style={[styles.historyItem, { borderColor }]}>
            <Text style={[styles.historyDate, { color: textColor }]}>
                Data: {item.calibration_date}
            </Text>
            <Text style={[styles.historyText, { color: secondaryText }]}>Técnico: {item.performed_by}</Text>
            <Text style={[styles.historyResult, {
                color: item.result === 'Aprovado' ? successColor : dangerColor
            }]}>
                Resultado: {item.result}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={[styles.container, { backgroundColor: bgColor }]}
                contentContainerStyle={{ paddingBottom: 100 }} // Espaço no final para o FAB
            >
                <Stack.Screen options={{ title: instrument.name }} />

                <ThemedText type="title" style={styles.title}>{instrument.name}</ThemedText>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <DetailRow label="Nº de Série" value={instrument.serial_number} />
                    <DetailRow label="Tipo" value={instrument.instrument_type} />
                    <DetailRow label="Status" value={instrument.status} />
                    <DetailRow label="Local" value={instrument.location} />
                    <DetailRow label="Precisão" value={instrument.precision} />
                </View>

                <ThemedText type="subtitle" style={styles.subtitle}>
                    Histórico de Calibrações
                </ThemedText>

                <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 20 }]}>
                    {instrument.calibrations && instrument.calibrations.length > 0 ? (
                        <FlatList
                            data={instrument.calibrations}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    ) : (
                        <ThemedText style={{ color: secondaryText, fontFamily: Fonts.sans }}>
                            Nenhuma calibração registrada.
                        </ThemedText>
                    )}
                </View>
            </ScrollView>

            <Pressable
                style={[styles.fab, { backgroundColor: primaryColor }]}
                onPress={onStartCalibration}
            >
                <Ionicons name="add" size={32} color="white" />
            </Pressable>
        </View>
    );
}

const DetailRow = ({ label, value }: { label: string, value?: string }) => {
    const textColor = useThemeColor({}, 'text');
    const secondaryText = useThemeColor({}, 'textSecondary');

    return (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: secondaryText }]}>{label}:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{value || 'N/A'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
        fontFamily: Fonts.sansBold,
    },
    subtitle: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        fontFamily: Fonts.sansSemiBold,
    },
    card: {
        marginHorizontal: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 16,
        fontFamily: Fonts.sans,
    },
    detailValue: {
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
    },
    historyItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    historyDate: {
        fontSize: 16,
        fontFamily: Fonts.sansBold,
    },
    historyText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        marginTop: 4,
    },
    historyResult: {
        fontSize: 14,
        fontFamily: Fonts.sansSemiBold,
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
});