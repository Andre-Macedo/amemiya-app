import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useMachineDetails } from '@/hooks/use-machines';
import { MachineHmiPanel } from '@/components/iot/machine-hmi-panel';

export default function MachineHmiDedicatedScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { width, height } = useWindowDimensions();

    const [isFullscreenView, setIsFullscreenView] = useState(false);

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const { data: machine, isLoading, refetch } = useMachineDetails(id);

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: '#0A0E14' }]}>
                <ActivityIndicator size="large" color="#00E676" />
                <Text style={{ color: '#90CAF9', marginTop: 14, fontFamily: Fonts.sansSemiBold }}>
                    Carregando Terminal IHM...
                </Text>
            </View>
        );
    }

    if (!machine) {
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ScreenHeader title="IHM da Máquina" showBack />
                <Text style={{ color: textSec, marginTop: 20 }}>Máquina não encontrada.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#070A0F' }}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header industrial escuro de operação */}
            <View style={styles.topNav}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </Pressable>

                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.navTitle} numberOfLines={1}>
                        IHM • {machine.name}
                    </Text>
                    <Text style={styles.navSub}>
                        Terminal Industrial 3.5" (480×320)
                    </Text>
                </View>

                <Pressable
                    style={[styles.actionBtn, isFullscreenView && { backgroundColor: '#00E67622' }]}
                    onPress={() => setIsFullscreenView(prev => !prev)}
                >
                    <Ionicons
                        name={isFullscreenView ? 'contract-outline' : 'expand-outline'}
                        size={20}
                        color={isFullscreenView ? '#00E676' : '#FFFFFF'}
                    />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {/* Visualizador do Display Físico 3.5" */}
                <View style={styles.panelContainer}>
                    <MachineHmiPanel
                        machine={machine}
                        nodes={machine.nodes || []}
                        isLandscapeFullscreen={isFullscreenView}
                    />
                </View>

                {/* Painel Inferior: Diagnóstico e Parâmetros em Tempo Real */}
                <View style={styles.diagnosticCard}>
                    <View style={styles.diagHeader}>
                        <Ionicons name="hardware-chip-outline" size={18} color="#64B5F6" />
                        <Text style={styles.diagTitle}>
                            Diagnóstico da Estação e Sensores
                        </Text>
                    </View>

                    <View style={styles.diagRow}>
                        <Text style={styles.diagLabel}>Posto de Trabalho:</Text>
                        <Text style={styles.diagVal}>
                            {machine.station?.name || 'Não vinculado'}
                        </Text>
                    </View>

                    <View style={styles.diagRow}>
                        <Text style={styles.diagLabel}>Sensores Ativos na Máquina:</Text>
                        <Text style={styles.diagVal}>
                            {machine.nodes?.length ? `${machine.nodes.length} nós acoplados` : 'Nenhum nó associado'}
                        </Text>
                    </View>

                    <View style={styles.diagRow}>
                        <Text style={styles.diagLabel}>Protocolo de Enlace:</Text>
                        <Text style={styles.diagVal}>
                            MQTT / Telemetria Industrial
                        </Text>
                    </View>

                    <View style={styles.diagRow}>
                        <Text style={styles.diagLabel}>Alvo de Hardware Físico:</Text>
                        <Text style={styles.diagVal}>
                            ESP32 + LCD SPI/RGB 3.5" (ILI9488 / ST7796)
                        </Text>
                    </View>
                </View>

                {/* Botão de retorno e ação */}
                <Pressable
                    style={styles.viewMachineDetailsBtn}
                    onPress={() => router.push(`/machines/${machine.id}` as any)}
                >
                    <Ionicons name="construct-outline" size={18} color="#90CAF9" />
                    <Text style={styles.viewMachineDetailsText}>
                        Ver Ficha Técnica e Histórico da Máquina
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#90CAF9" />
                </Pressable>
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
    topNav: {
        height: 60,
        backgroundColor: '#0F1622',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2332',
    },
    backBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#1E2C42',
    },
    navTitle: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 16,
    },
    navSub: {
        color: '#64B5F6',
        fontFamily: Fonts.sans,
        fontSize: 11,
    },
    actionBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#1E2C42',
    },
    container: {
        padding: 16,
        paddingBottom: 40,
        alignItems: 'center',
    },
    panelContainer: {
        marginVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    diagnosticCard: {
        width: '100%',
        backgroundColor: '#0F1622',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1C293E',
        padding: 16,
        marginTop: 20,
    },
    diagHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2332',
        paddingBottom: 10,
        marginBottom: 12,
    },
    diagTitle: {
        color: '#FFFFFF',
        fontFamily: Fonts.sansBold,
        fontSize: 14,
    },
    diagRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    diagLabel: {
        color: '#90A4AE',
        fontFamily: Fonts.sans,
        fontSize: 13,
    },
    diagVal: {
        color: '#ECEFF1',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    viewMachineDetailsBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#131D2A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E2C42',
        paddingVertical: 14,
        marginTop: 18,
    },
    viewMachineDetailsText: {
        color: '#90CAF9',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
});
