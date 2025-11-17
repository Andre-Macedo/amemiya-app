import React from 'react';
import { StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';
import InstrumentCard from '@/components/instrument-card';
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Stack } from 'expo-router'; // Importar Stack
import { Ionicons } from '@expo/vector-icons';
import {DrawerToggleButton} from "@react-navigation/drawer";

export default function InstrumentsScreen() {
    const bgColor = useThemeColor({}, 'background');
    const headerIconColor = useThemeColor({}, 'primary');
    const headerTintColor = useThemeColor({}, 'text');

    const handleFilterPress = () => {
        console.log("Botão de filtro pressionado!");
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Define o header para ESTA tela */}
            <Stack.Screen
                options={{
                    title: 'Instrumentos',
                    headerLeft: () => (
                        <DrawerToggleButton tintColor={headerTintColor} />
                    ),

                    headerRight: () => (
                        <Pressable onPress={handleFilterPress} style={{ marginRight: 15 }}>
                            <Ionicons name="filter-outline" size={24} color={headerIconColor} />
                        </Pressable>
                    )
                }}
            />

            <FlatList
                data={DUMMY_INSTRUMENTS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <InstrumentCard item={item} />}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        padding: 20,
    },
});