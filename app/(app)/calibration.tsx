import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function CalibrationScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Tela de Calibração</ThemedText>
            <ThemedText>
                Aqui começará o fluxo de calibração,
                provavelmente com um scanner NFC ou seleção de instrumento.
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});