import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme'; // Importe as fontes para estilizar o drawer

function DrawerIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
    return <Ionicons name={name} size={22} color={color} />;
}

export default function AppLayout() {
    const drawerBg = useThemeColor({}, 'white');
    const activeTint = useThemeColor({}, 'primary');
    const text = useThemeColor({}, 'text');

    return (
        <Drawer
            screenOptions={{
                headerShown: false, // Esconde o header padrão do drawer em TODAS as telas (vamos usar headers customizados)
                drawerActiveTintColor: activeTint,
                drawerInactiveTintColor: text,
                drawerStyle: {
                    backgroundColor: drawerBg,
                    width: 280, // Largura um pouco mais elegante
                },
                drawerLabelStyle: {
                    fontFamily: Fonts.sansSemiBold,
                    marginLeft: -10, // Aproxima texto do ícone
                },
                drawerType: 'slide', // Animação mais moderna
            }}
        >
            {/* Rota Inicial agora é direta, sem Tabs */}
            <Drawer.Screen
                name="index" // Aponta para app/(app)/index.tsx
                options={{
                    drawerLabel: 'Dashboard',
                    title: 'Dashboard',
                    drawerIcon: ({ color }) => <DrawerIcon name="grid-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="instruments"
                options={{
                    drawerLabel: 'Instrumentos',
                    title: 'Instrumentos',
                    drawerIcon: ({ color }) => <DrawerIcon name="construct-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="calibration"
                options={{
                    drawerLabel: 'Nova Calibração',
                    title: 'Nova Calibração',
                    drawerIcon: ({ color }) => <DrawerIcon name="add-circle-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="profile"
                options={{
                    drawerLabel: 'Meu Perfil',
                    title: 'Perfil',
                    drawerIcon: ({ color }) => <DrawerIcon name="person-circle-outline" color={color} />,
                }}
            />

            {/* Esconda rotas que não devem aparecer no menu lateral */}
            <Drawer.Screen
                name="calibration-details/[calibrationId]"
                options={{
                    drawerItemStyle: { display: 'none' }
                }}
            />
        </Drawer>
    );
}