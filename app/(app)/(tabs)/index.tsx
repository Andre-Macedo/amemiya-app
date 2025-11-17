import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/stat-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
export default function HomeScreen() {
    const { user } = useAuth();
    const theme = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: theme}]}>
            <ScrollView style={[styles.screenContainer, ]}>
                <Text style={[styles.screenTitle, {color: textColor} ]}>Dashboard</Text>
                <Text style={[styles.welcomeText, {color: textSecondary} ]}>Bem-vindo, {user?.name}!</Text>

                <View style={[styles.statsContainer, ]}>
                    <StatCard title="Instrumentos Ativos" value="128" icon="checkmark-circle-outline" />
                    <StatCard title="Calibrações Vencidas" value="12" icon="alert-circle-outline" />
                    <StatCard title="Padrões Disponíveis" value="34" icon="cube-outline" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenContainer: {
        flex: 1,
        padding: 20,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        fontFamily: Fonts.sansBold,
    },
    welcomeText: {
        fontSize: 18,
        marginBottom: 30,
        fontWeight: '600',
    },
    statsContainer: {
        gap: 15,
    },
});