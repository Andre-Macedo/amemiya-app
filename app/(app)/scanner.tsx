import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { api } from '@/services/api';
import { useStations } from '@/hooks/use-stations';

export default function UniversalScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [mode, setMode] = useState<'navigate' | 'custody'>('navigate');

    // Estado da movimentação de custódia
    const [custodyTag, setCustodyTag] = useState<string | null>(null);
    const [stationModalVisible, setStationModalVisible] = useState(false);
    const [transferLoading, setTransferLoading] = useState(false);

    const { data: stations = [] } = useStations();

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const primary = useThemeColor({}, 'primary');
    const textSec = useThemeColor({}, 'textSecondary');
    const text = useThemeColor({}, 'text');
    const border = useThemeColor({}, 'border');

    if (!permission) {
        return <View style={{ flex: 1, backgroundColor: bg }} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.permissionContainer, { backgroundColor: bg }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ScreenHeader title="Escanear Código" showBack />
                <Ionicons name="camera-outline" size={64} color={primary} />
                <Text style={[styles.permissionText, { color: textSec }]}>
                    Precisamos de acesso à câmera para ler QR Codes de instrumentos, máquinas e sensores.
                </Text>
                <Pressable style={[styles.btn, { backgroundColor: primary }]} onPress={requestPermission}>
                    <Text style={styles.btnText}>Conceder Permissão</Text>
                </Pressable>
            </View>
        );
    }

    const handleExecuteCustodyTransfer = async (tagId: string, stationId?: string) => {
        setTransferLoading(true);
        try {
            const res = await api.post('/instruments/scan', {
                tag_id: tagId,
                to_station_id: stationId || undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert(
                'Custódia Registrada (F-08)',
                res.data?.message || 'Instrumento transferido com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCustodyTag(null);
                            setStationModalVisible(false);
                            setScanned(false);
                        },
                    },
                ]
            );
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            const msg = err?.response?.data?.message || 'Erro ao registrar movimentação de custódia.';
            Alert.alert('Falha na Custódia', msg, [{ text: 'OK', onPress: () => setScanned(false) }]);
        } finally {
            setTransferLoading(false);
        }
    };

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // Modo Custódia Rápida (F-08 Handover)
        if (mode === 'custody') {
            const cleanTag = data.replace(/^INST:/, '').trim();
            setCustodyTag(cleanTag);
            setStationModalVisible(true);
            return;
        }

        // Lógica de roteamento inteligente baseada no payload do QR Code (Modo Navegação)
        try {
            if (data.startsWith('http://') || data.startsWith('https://')) {
                const url = new URL(data);
                const path = url.pathname;

                if (path.includes('/instruments/')) {
                    const id = path.split('/instruments/')[1];
                    router.replace(`/instruments/${id}` as any);
                    return;
                }
                if (path.includes('/stations/')) {
                    const id = path.split('/stations/')[1];
                    router.replace(`/stations/${id}` as any);
                    return;
                }
            }

            if (data.startsWith('INST:')) {
                const id = data.replace('INST:', '').trim();
                router.replace(`/instruments/${id}` as any);
                return;
            }
            if (data.startsWith('MACH:') || data.startsWith('STATION:')) {
                const id = data.replace(/^(MACH|STATION):/, '').trim();
                router.replace(`/stations/${id}` as any);
                return;
            }
            if (data.startsWith('NODE:') || data.startsWith('SENSOR:')) {
                const id = data.replace(/^(NODE|SENSOR):/, '').trim();
                router.replace(`/iot/${id}` as any);
                return;
            }

            Alert.alert(
                'Código Escaneado',
                `Valor: ${data}`,
                [
                    { text: 'Escanear Novamente', onPress: () => setScanned(false) },
                    { text: 'Buscar Instrumento', onPress: () => router.replace(`/instruments?search=${data}` as any) },
                ]
            );
        } catch {
            setScanned(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Escanear QR Code" showBack />

            <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Seletor de Modo no Topo */}
            <View style={styles.modeToggleContainer}>
                <Pressable
                    style={[
                        styles.modeButton,
                        mode === 'navigate' && { backgroundColor: primary },
                    ]}
                    onPress={() => {
                        setMode('navigate');
                        setScanned(false);
                        setCustodyTag(null);
                    }}
                >
                    <Ionicons
                        name="compass-outline"
                        size={16}
                        color={mode === 'navigate' ? '#fff' : '#aaa'}
                    />
                    <Text
                        style={[
                            styles.modeButtonText,
                            { color: mode === 'navigate' ? '#fff' : '#aaa' },
                        ]}
                    >
                        Navegação
                    </Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.modeButton,
                        mode === 'custody' && { backgroundColor: '#FF9500' },
                    ]}
                    onPress={() => {
                        setMode('custody');
                        setScanned(false);
                        setCustodyTag(null);
                    }}
                >
                    <Ionicons
                        name="swap-horizontal-outline"
                        size={16}
                        color={mode === 'custody' ? '#fff' : '#aaa'}
                    />
                    <Text
                        style={[
                            styles.modeButtonText,
                            { color: mode === 'custody' ? '#fff' : '#aaa' },
                        ]}
                    >
                        Custódia F-08
                    </Text>
                </Pressable>
            </View>

            {/* Overlay com Mira Industrial */}
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.reticle,
                        mode === 'custody' && { borderColor: '#FF9500' },
                    ]}
                />
                <Text style={styles.instructionText}>
                    {mode === 'custody'
                        ? 'Aponte para a plaqueta do Instrumento para transferir custódia'
                        : 'Aponte para a plaqueta da máquina, instrumento ou sensor'}
                </Text>

                {scanned && !stationModalVisible && (
                    <Pressable
                        style={[styles.rescanBtn, { backgroundColor: mode === 'custody' ? '#FF9500' : primary }]}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.btnText}>Escanear Novamente</Text>
                    </Pressable>
                )}
            </View>

            {/* Modal de Seleção de Estação Destino na Custódia */}
            <Modal visible={stationModalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: text }]}>Transferir Custódia (F-08)</Text>
                                <Text style={[styles.modalSubtitle, { color: textSec }]}>
                                    Tag do Instrumento: <Text style={{ fontFamily: Fonts.sansBold, color: primary }}>{custodyTag}</Text>
                                </Text>
                            </View>
                            <Pressable
                                hitSlop={10}
                                onPress={() => {
                                    setStationModalVisible(false);
                                    setScanned(false);
                                    setCustodyTag(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color={textSec} />
                            </Pressable>
                        </View>

                        <Text style={[styles.sectionHeading, { color: textSec }]}>
                            Selecione o Posto / Estação de Destino:
                        </Text>

                        {transferLoading ? (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={primary} />
                                <Text style={{ marginTop: 12, color: textSec, fontFamily: Fonts.sansSemiBold }}>
                                    Registrando custódia...
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={stations}
                                keyExtractor={item => item.id}
                                style={{ maxHeight: 300 }}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={[styles.stationItem, { borderColor: border }]}
                                        onPress={() => custodyTag && handleExecuteCustodyTransfer(custodyTag, item.id)}
                                    >
                                        <View style={[styles.stationIconBox, { backgroundColor: primary + '15' }]}>
                                            <Ionicons name="location-outline" size={20} color={primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.stationName, { color: text }]}>{item.name}</Text>
                                            <Text style={[styles.stationSub, { color: textSec }]}>
                                                {item.location || 'Sem localização'} {item.code ? `• ${item.code}` : ''}
                                            </Text>
                                        </View>
                                        <Ionicons name="arrow-forward" size={18} color={textSec} />
                                    </Pressable>
                                )}
                                ListEmptyComponent={
                                    <Text style={{ textAlign: 'center', marginVertical: 20, color: textSec }}>
                                        Nenhum posto de trabalho encontrado.
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    permissionText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 20,
    },
    btn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    modeToggleContainer: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 24,
        padding: 4,
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    modeButtonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    reticle: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: '#fff',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        marginTop: 24,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    rescanBtn: {
        marginTop: 30,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 36,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: Fonts.sansBold,
        fontSize: 18,
    },
    modalSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        marginTop: 2,
    },
    sectionHeading: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    stationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    stationIconBox: {
        width: 38,
        height: 38,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stationName: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    stationSub: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
    },
});
