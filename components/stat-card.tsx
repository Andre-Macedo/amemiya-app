import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color'; // IMPORTE O HOOK
import { Fonts } from '@/constants/theme'; // IMPORTE AS FONTES

interface StatCardProps {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {

    const primaryColor = useThemeColor({}, "primary");
    const cardBgColor = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');

    return (
        <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <View style={styles.statCardHeader}>
                <Ionicons name={icon} size={32} color={primaryColor} />
            </View>
            <Text style={[styles.statCardValue, { color: textColor }]}>{value}</Text>
            <Text style={[styles.statCardTitle, { color: textSecondaryColor }]}>{title}</Text>
        </View>
    );
};

export default StatCard;

const styles = StyleSheet.create({
    statCard: {
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        width: '100%',
    },
    statCardHeader: {
        marginBottom: 15,
    },
    statCardValue: {
        fontSize: 36,
        fontFamily: Fonts.sansBold,
        marginBottom: 5,
    },
    statCardTitle: {
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
    },
});