import {Stack, useLocalSearchParams, useRouter, useSegments} from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Instrument } from '@/types/entities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function InstrumentDetailScreen() {
    const { id: paramId } = useLocalSearchParams<{ id: string }>(); // Renomeia para evitar conflito
    const segments = useSegments();

    // --- LÓGICA DE EXTRAÇÃO ROBUSTA DO ID ---
    // 1. Tenta obter o ID que está na posição fixa (índice 2)
    const segmentIdCandidate = segments.length >= 3 ? segments[2] : null;

    let idToUse: string | null = null;

    if (paramId) {
        // 2. Prioriza o ID do useLocalSearchParams (se funcionar)
        idToUse = paramId;
    } else if (segmentIdCandidate && segmentIdCandidate !== '[id]') {
        // 3. Usa o ID dos segmentos, mas IGNORA o literal da pasta '[id]'
        idToUse = segmentIdCandidate;
    }

    // O ID a ser usado na busca pelos DUMMY_INSTRUMENTS
    const instrument: Instrument | undefined = DUMMY_INSTRUMENTS.find(inst => inst.id === idToUse);    // O console.log de depuração pode ser útil:
    console.log('ID final usado (idToUse):', idToUse);
    console.log('Instrumento encontrado:', !!instrument);

    const router = useRouter();

    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const secondaryText = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');

    const onStartCalibration = () => {
        router.push({
            pathname: '/calibration',
            params: { instrumentId: paramId }
        });
    };

    if (!instrument) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
                <ThemedText>Instrumento não encontrado.</ThemedText>
            </ThemedView>
        );
    }

    return (

            <View style={{ flex: 1 }}>
                <ScrollView
                    style={[styles.container, { backgroundColor: bgColor }]}
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                >
                    {/* Título da tela pai (Stack) */}
                    <Stack.Screen options={{ title: instrument.name }} />

                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <DetailRow label="Nº de Série" value={instrument.serial_number} />
                        <DetailRow label="Tipo" value={instrument.instrument_type} />
                        <DetailRow label="Status" value={instrument.status} />
                        <DetailRow label="Local" value={instrument.location} />
                        <DetailRow label="Precisão" value={instrument.precision} />
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