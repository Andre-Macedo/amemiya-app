import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';

export default function CreateWorkOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        machineId?: string;
        machineName?: string;
        instrumentId?: string;
        instrumentName?: string;
    }>();

    const [notes, setNotes] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const bg = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const textSec = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    const targetName = params.machineName || params.instrumentName || 'Ativo Industrial';
    const isMachine = !!params.machineId;
    const itemId = params.machineId || params.instrumentId;

    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Acesso à câmera é necessário para fotografar o componente.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhotoUri(result.assets[0].uri);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível acionar a câmera.');
        }
    };

    const handlePickGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhotoUri(result.assets[0].uri);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível acessar a galeria.');
        }
    };

    const handleSubmit = async () => {
        if (!itemId) {
            Alert.alert('Erro', 'Nenhum item ou máquina foi especificado para a Ordem de Serviço.');
            return;
        }

        if (!notes.trim()) {
            Alert.alert('Campo Obrigatório', 'Descreva o motivo ou a anomalia visual identificada.');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('item_id', itemId);
            formData.append('item_type', isMachine ? 'machine' : 'instrument');
            formData.append('visual_inspection_notes', notes.trim());
            if (customerNotes.trim()) {
                formData.append('customer_notes', customerNotes.trim());
            }

            if (photoUri) {
                const filename = photoUri.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                // @ts-expect-error React Native FormData file signature
                formData.append('photo', {
                    uri: Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri,
                    name: filename,
                    type,
                });
            }

            await api.post('/work-orders', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

            Alert.alert(
                'Sucesso!',
                'Ordem de Serviço criada com sucesso e registrada no histórico do ativo.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Falha ao registrar a Ordem de Serviço.';
            Alert.alert('Falha na Criação', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Nova Ordem de Serviço" showBack />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Identificação do Ativo */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.cardHeaderRow}>
                        <Ionicons
                            name={isMachine ? 'cog-outline' : 'construct-outline'}
                            size={22}
                            color={primary}
                        />
                        <Text style={[styles.targetLabel, { color: textSec }]}>
                            {isMachine ? 'MÁQUINA VINCULADA' : 'INSTRUMENTO VINCULADO'}
                        </Text>
                    </View>
                    <Text style={[styles.targetName, { color: text }]}>{targetName}</Text>
                    <Text style={[styles.targetSub, { color: textSec }]}>
                        ID: {itemId || 'Não informado'}
                    </Text>
                </View>

                {/* Registro Visual / Foto */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Registro Fotográfico</Text>
                    <Text style={[styles.sectionSub, { color: textSec }]}>
                        Capture evidências visuais de desgaste, ruído mecânico ou dano.
                    </Text>

                    {photoUri ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                            <Pressable style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                                <Ionicons name="trash-outline" size={18} color="#FFF" />
                                <Text style={styles.removePhotoText}>Remover Foto</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.photoActionsRow}>
                            <Pressable
                                style={[styles.actionBtn, { borderColor: primary, backgroundColor: primary + '10' }]}
                                onPress={handleTakePhoto}
                            >
                                <Ionicons name="camera-outline" size={24} color={primary} />
                                <Text style={[styles.actionBtnText, { color: primary }]}>Tirar Foto</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.actionBtn, { borderColor: border, backgroundColor: cardBg }]}
                                onPress={handlePickGallery}
                            >
                                <Ionicons name="images-outline" size={24} color={textSec} />
                                <Text style={[styles.actionBtnText, { color: textSec }]}>Galeria</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* Descrição do Problema / Inspeção */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Inspeção Visual & Anomalia *</Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: bg,
                                borderColor: border,
                                color: text,
                            },
                        ]}
                        placeholder="Ex: Folga excessiva no mancal dianteiro, aquecimento anômalo (>75°C) e pico de vibração 1X..."
                        placeholderTextColor={textSec}
                        multiline
                        numberOfLines={4}
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                    />

                    <Text style={[styles.sectionTitle, { color: text, marginTop: 14 }]}>Observações Internas (Opcional)</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: bg,
                                borderColor: border,
                                color: text,
                            },
                        ]}
                        placeholder="Ex: Solicitar balanceamento dinâmico em 1 plano"
                        placeholderTextColor={textSec}
                        value={customerNotes}
                        onChangeText={setCustomerNotes}
                    />
                </View>

                {/* Botão de Envio */}
                <Pressable
                    style={[
                        styles.submitBtn,
                        { backgroundColor: primary },
                        isSubmitting && { opacity: 0.7 },
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                            <Text style={styles.submitBtnText}>Abrir Ordem de Serviço</Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 40,
        gap: 14,
    },
    card: {
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    targetLabel: {
        fontFamily: Fonts.sansBold,
        fontSize: 11,
        letterSpacing: 0.6,
    },
    targetName: {
        fontFamily: Fonts.sansBold,
        fontSize: 17,
        marginTop: 2,
    },
    targetSub: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
    },
    sectionTitle: {
        fontFamily: Fonts.sansBold,
        fontSize: 14,
        marginBottom: 2,
    },
    sectionSub: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginBottom: 12,
    },
    photoActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionBtnText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    previewContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    removePhotoBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#E53E3Ecc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    removePhotoText: {
        color: '#FFF',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        fontFamily: Fonts.sans,
        minHeight: 90,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        fontFamily: Fonts.sans,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 10,
    },
    submitBtnText: {
        color: '#FFF',
        fontFamily: Fonts.sansBold,
        fontSize: 15,
    },
});
