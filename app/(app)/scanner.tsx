import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function UniversalScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    const bg = useThemeColor({}, 'background');
    const primary = useThemeColor({}, 'primary');
    const textSec = useThemeColor({}, 'textSecondary');

    if (!permission) {
        return <View style={{ flex: 1, backgroundColor: bg }} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.permissionContainer, { backgroundColor: bg }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ScreenHeader title="Escanear Código" showBack />
                <Ionicons name="camera-outline" size={64} color={primary} />
                <Text style={styles.permissionText}>
                    Precisamos de acesso à câmera para ler QR Codes de instrumentos, máquinas e sensores.
                </Text>
                <Pressable style={[styles.btn, { backgroundColor: primary }]} onPress={requestPermission}>
                    <Text style={styles.btnText}>Conceder Permissão</Text>
                </Pressable>
            </View>
        );
    }

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // Lógica de roteamento inteligente baseada no payload do QR Code
        try {
            if (data.startsWith('http://') || data.startsWith('https://')) {
                // Se for URL do sistema (ex: .../instruments/123 ou .../stations/abc)
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

            // Se for prefixado por tipo (ex: INST:123, MACH:abc, SENSOR:xyz)
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

            // Fallback: Tenta como serial de instrumento
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

            {/* Overlay com Mira Industrial */}
            <View style={styles.overlay}>
                <View style={styles.reticle} />
                <Text style={styles.instructionText}>
                    Aponte para a plaqueta da máquina, instrumento ou sensor
                </Text>

                {scanned && (
                    <Pressable
                        style={[styles.rescanBtn, { backgroundColor: primary }]}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.btnText}>Escanear Novamente</Text>
                    </Pressable>
                )}
            </View>
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
});
