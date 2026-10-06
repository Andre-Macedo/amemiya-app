import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

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
                headerShown: false,
                drawerActiveTintColor: activeTint,
                drawerInactiveTintColor: text,
                drawerStyle: {
                    backgroundColor: drawerBg,
                    width: 290,
                },
                drawerLabelStyle: {
                    fontFamily: Fonts.sansSemiBold,
                    marginLeft: -8,
                },
                drawerType: 'slide',
            }}
        >
            <Drawer.Screen
                name="index"
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
                name="intermediate-check"
                options={{
                    drawerLabel: 'Checagem Shewhart',
                    title: 'Checagem Intermediária',
                    drawerIcon: ({ color }) => <DrawerIcon name="analytics-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="stations/index"
                options={{
                    drawerLabel: 'Postos & Células',
                    title: 'Postos de Trabalho',
                    drawerIcon: ({ color }) => <DrawerIcon name="business-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="machines/index"
                options={{
                    drawerLabel: 'Máquinas & IHM',
                    title: 'Máquinas & IHM',
                    drawerIcon: ({ color }) => <DrawerIcon name="tv-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="iot/index"
                options={{
                    drawerLabel: 'Sensores IoT & IHM',
                    title: 'Sensores IoT',
                    drawerIcon: ({ color }) => <DrawerIcon name="hardware-chip-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="iot-network/index"
                options={{
                    drawerLabel: 'Topologia da Rede',
                    title: 'Topologia IoT',
                    drawerIcon: ({ color }) => <DrawerIcon name="git-network-outline" color={color} />,
                }}
            />

            <Drawer.Screen
                name="scanner"
                options={{
                    drawerLabel: 'Escanear QR Code',
                    title: 'Scanner',
                    drawerIcon: ({ color }) => <DrawerIcon name="qr-code-outline" color={color} />,
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

            {/* Rotas de Detalhes ocultas do Drawer */}
            <Drawer.Screen
                name="calibration-details/[calibrationId]"
                options={{ drawerItemStyle: { display: 'none' } }}
            />
            <Drawer.Screen
                name="stations/[id]"
                options={{ drawerItemStyle: { display: 'none' } }}
            />
            <Drawer.Screen
                name="iot/[id]"
                options={{ drawerItemStyle: { display: 'none' } }}
            />
            <Drawer.Screen
                name="machines/[id]"
                options={{ drawerItemStyle: { display: 'none' } }}
            />
            <Drawer.Screen
                name="machines/[id]/hmi"
                options={{ drawerItemStyle: { display: 'none' } }}
            />
        </Drawer>
    );
}