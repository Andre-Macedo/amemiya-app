import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";

interface ScreenHeaderProps {
    title: string;
    showBack?: boolean;
    // --- NOVAS PROPS ---
    rightIcon?: keyof typeof Ionicons.glyphMap; // Garante que só aceite nomes válidos de ícones
    rightAction?: () => void;
    rightColor?: string;
}

export function ScreenHeader({
                                 title,
                                 showBack = false,
                                 rightIcon,
                                 rightAction,
                                 rightColor
                             }: ScreenHeaderProps) {
    const navigation = useNavigation();
    const router = useRouter();

    const bg = useThemeColor({}, 'background');
    const text = useThemeColor({}, 'text');

    // Cor padrão se não for passada
    const defaultIconColor = useThemeColor({}, 'textSecondary');

    const insets = useSafeAreaInsets();

    const handleLeftPress = () => {
        if (showBack) {
            router.back();
        } else {
            navigation.dispatch(DrawerActions.toggleDrawer());
        }
    };

    return (

        <View style={[
            styles.container,
            {
                backgroundColor: bg,
                paddingTop: insets.top,
                height: 60 + insets.top
            }
        ]}>
            {/* BOTÃO ESQUERDO */}
            <TouchableOpacity onPress={handleLeftPress} style={styles.buttonLeft}>
                <Ionicons
                    name={showBack ? "arrow-back" : "menu"}
                    size={24}
                    color={text}
                />
            </TouchableOpacity>

            {/* TÍTULO */}
            <Text style={[styles.title, { color: text }]} numberOfLines={1}>
                {title}
            </Text>

            {/* BOTÃO DIREITO (Condicional) */}
            {rightIcon ? (
                <TouchableOpacity onPress={rightAction} style={styles.buttonRight}>
                    <Ionicons
                        name={rightIcon}
                        size={24}
                        color={rightColor || defaultIconColor}
                    />
                </TouchableOpacity>
            ) : (
                // View vazia para manter o título centralizado se não tiver botão
                <View style={styles.buttonRight} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    // Estilo base para tamanho da área de toque
    buttonLeft: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start', // Alinha à esquerda
    },
    buttonRight: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end', // Alinha à direita
    },
    title: {
        flex: 1, // Ocupa o espaço disponível no meio
        fontSize: 18,
        fontFamily: Fonts.sansBold,
        textAlign: 'center',
    }
});