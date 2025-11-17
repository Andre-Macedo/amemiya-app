import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

// Componente de ícone (sem alteração)
function DrawerIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
    return <Ionicons name={name} size={22} color={color} />;
}

// Componente para o Botão de Filtro (NOVO)
function FilterButton() {
    const headerIconColor = useThemeColor({}, 'primary');
    const handleFilterPress = () => {
        // No futuro, isso pode abrir um modal: router.push('/filter-modal')
        console.log("Botão de filtro pressionado!");
    };

    return (
        <Pressable onPress={handleFilterPress} style={{ marginRight: 15 }}>
            <Ionicons name="filter-outline" size={24} color={headerIconColor} />
        </Pressable>
    );
}

export default function AppLayout() {
    return (
        <Drawer>
            <Drawer.Screen
                name="(tabs)"
                options={{
                    drawerLabel: 'Dashboard',
                    title: 'Dashboard',
                    drawerIcon: ({ color }) => <DrawerIcon name="stats-chart-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="profile"
                options={{
                    drawerLabel: 'Perfil',
                    title: 'Perfil',
                    drawerIcon: ({ color }) => <DrawerIcon name="person-circle-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="instruments"
                options={{
                    drawerLabel: 'Instrumentos',
                    title: 'Instrumentos',
                    drawerIcon: ({ color }) => <DrawerIcon name="construct-outline" color={color} />,

                    // --- A MUDANÇA ESTÁ AQUI ---
                    // Esconde o header do Drawer para esta seção,
                    // permitindo que o Stack interno assuma.
                    headerShown: false,
                    // --------------------------
                }}
            />
            <Drawer.Screen
                name="calibration"
                options={{
                    drawerLabel: 'Iniciar Calibração',
                    title: 'Iniciar Calibração',
                    drawerIcon: ({ color }) => <DrawerIcon name="clipboard-outline" color={color} />,
                }}
            />

        </Drawer>
    );
}