import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { Calibration } from '@/types/entities';

// Função para simular o download (no futuro, integraria com expo-file-system)
const handleDownload = (path: string | undefined) => {
    if (!path) {
        alert('Caminho do certificado não disponível no mock data.');
        return;
    }
    // Lógica real de download aqui
    alert(`Simulando download do certificado em: ${path}`);
    console.log(`Downloading: ${path}`);
};

export default function CalibrationDetailsScreen() {
    const { calibrationId } = useLocalSearchParams<{ calibrationId: string }>();

    // Lógica para encontrar a calibração específica (usando mock data aninhado)
    const calibration: Calibration | undefined = DUMMY_INSTRUMENTS
        .flatMap(inst => inst.calibrations || [])
        .find(cal => cal.id === calibrationId);

    // Hooks de Cor
    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary');
    const secondaryText = useThemeColor({}, 'textSecondary');

    if (!calibration) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <Text style={styles.notFoundText}>Calibração não encontrada.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen options={{ title: `Calibração #${calibration.id}` }} />

            <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>

                <Text style={[styles.title, { color: textColor }]}>
                    Detalhes do Evento
                </Text>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <DetailRow label="ID do Evento" value={calibration.id} />
                    <DetailRow label="Data" value={calibration.calibration_date} />
                    <DetailRow label="Técnico" value={calibration.performed_by} />
                    <DetailRow label="Resultado" value={calibration.result} isBold={true} />
                </View>

                <Text style={[styles.title, { color: textColor, marginTop: 20 }]}>
                    Certificado e Notas
                </Text>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <DetailRow label="Notas" value={calibration.notes || 'Nenhuma nota.'} />

                    {/* Botão de Download */}
                    <Pressable
                        style={[styles.downloadButton, { backgroundColor: primaryColor }]}
                        onPress={() => handleDownload(`/certificates/${calibration.id}.pdf`)}
                    >
                        <Ionicons name="download-outline" size={20} color="white" />
                        <Text style={styles.downloadText}>Baixar Certificado</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </View>
    );
}

// Componente auxiliar para as linhas de detalhe (ajustado para esta tela)
const DetailRow = ({ label, value, isBold }: { label: string, value?: string, isBold?: boolean }) => {
    const textColor = useThemeColor({}, 'text');
    const secondaryText = useThemeColor({}, 'textSecondary');

    return (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel]}>{label}:</Text>
            <Text style={[styles.detailValue, {
                color: isBold ? textColor : secondaryText,
                fontFamily: isBold ? Fonts.sansBold : Fonts.sansSemiBold
            }]}>{value || 'N/A'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    title: {
        fontSize: 20,
        fontFamily: Fonts.sansBold,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    card: {
        marginHorizontal: 10,
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
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    detailLabel: {
        fontSize: 16,
        fontFamily: Fonts.sans,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    downloadText: {
        color: 'white',
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
        marginLeft: 10,
    },
    notFoundText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        fontFamily: Fonts.sansSemiBold,
        color: 'red',
    }
});