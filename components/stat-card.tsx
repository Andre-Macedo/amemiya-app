import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

const { width } = Dimensions.get('window');
// Calcula largura para caber 2 cards com espaçamento (20px padding total + 12px gap)
const CARD_WIDTH = (width - 40 - 12) / 2;

interface StatCardProps {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    type?: 'primary' | 'danger' | 'warning' | 'success' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, type = 'primary' }) => {
    const cardBgColor = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    // Cores semânticas para o ícone e fundo do ícone
    const primary = useThemeColor({}, 'primary');
    const danger = useThemeColor({}, 'danger');
    const warning = useThemeColor({}, 'warning');
    const success = useThemeColor({}, 'success');
    const textSec = useThemeColor({}, 'textSecondary');

    let iconColor = primary;
    if (type === 'danger') iconColor = danger;
    if (type === 'warning') iconColor = warning;
    if (type === 'success') iconColor = success;
    if (type === 'neutral') iconColor = textSec;

    return (
        <View style={[styles.statCard, { backgroundColor: cardBgColor, borderColor, width: CARD_WIDTH }]}>
            <View style={[styles.headerRow]}>
                {/* O '15' no final do hex adiciona transparência (alpha) */}
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                    <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                {/* Opcional: Adicionar uma seta ou indicador de tendência aqui */}
            </View>

            <Text style={[styles.statCardValue, { color: textColor }]}>{value}</Text>
            <Text style={[styles.statCardTitle, { color: textSec }]} numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
};

export default StatCard;

const styles = StyleSheet.create({
    statCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        // Removemos a sombra pesada para um look "Flat/Clean"
        elevation: 0,
        alignItems: 'flex-start',
        marginBottom: 0, // O grid controlará o espaçamento
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 10,
    },
    statCardValue: {
        fontSize: 24,
        fontFamily: Fonts.sansBold,
        marginBottom: 4,
    },
    statCardTitle: {
        fontSize: 13,
        fontFamily: Fonts.sans,
    },
});