import {router, Tabs} from 'expo-router';
import {Stack, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useThemeColor} from '@/hooks/use-theme-color';
import {DUMMY_INSTRUMENTS} from "@/data/dummyData";
import {DrawerToggleButton} from "@react-navigation/drawer";
import React from "react";
import { Pressable, View, Text } from 'react-native';   // ← ESSA LINHA!

export default function InstrumentDetailTabsLayout() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const params = useLocalSearchParams();
    console.log(params);
    const instrument = DUMMY_INSTRUMENTS.find(i => i.id === id);
    const tintColor = useThemeColor({}, 'accent');
    const title = (instrument?.name || 'Instrumento');
    const color = useThemeColor({}, 'text');

    const subtitle = instrument?.serial_number || '';
    const textColor = useThemeColor({}, 'text');
    const accentColor = useThemeColor({}, 'accent');
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerTitle: `${title} ${subtitle}`,
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 18,
                    color: textColor,
                    marginBottom: 4
                },
                headerLeft: () => (
                    <Pressable
                        onPress={() => router.back()}
                        style={{ marginLeft: 12 }} // padrão do sistema
                    >
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </Pressable>
                ),

                headerStyle: { backgroundColor: useThemeColor({}, 'background') },
                tabBarActiveTintColor: accentColor,
                tabBarStyle: { backgroundColor: useThemeColor({}, 'white') },
            }}
        >
            <Tabs.Screen
                name="details"
                options={{
                    title: 'Detalhes',
                    tabBarIcon: ({color}) => (
                        <Ionicons name="information-circle-outline" size={24} color={color}/>
                    ),
                }}
                initialParams={{id: id}}
            />

            <Tabs.Screen
                name="history"
                options={{
                    title: 'Histórico',
                    tabBarIcon: ({color}) => <Ionicons name="time-outline" size={24} color={color}/>,
                }}
                initialParams={{id: id}}
            />
        </Tabs>
    );
}