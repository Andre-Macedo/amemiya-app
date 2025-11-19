import { Stack } from 'expo-router';
import {DrawerToggleButton} from "@react-navigation/drawer";
import {Pressable} from "react-native";
import {Ionicons} from "@expo/vector-icons";

export default function InstrumentsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Instrumentos',
                    headerLeft: () => <DrawerToggleButton />,
                    headerRight: () => (
                        <Pressable onPress={() => console.log('filtro')} style={{ marginRight: 15 }}>
                            <Ionicons name="filter-outline" size={24} color="#000" />
                        </Pressable>
                    ),
                }}
            />

            <Stack.Screen name="[id]" options={{ headerShown: false }} />
        </Stack>
    );
}