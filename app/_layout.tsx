import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-gesture-handler'; // <-- ADICIONE NO TOPO
import 'react-native-reanimated';

import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';


SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isSessionLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (isSessionLoading || !fontsLoaded) {
      return;
    }

    const inTabsGroup = segments[0] === '(app)';

    if (user && !inTabsGroup) {
      router.replace('/');
    } else if (!user) {
      router.replace('/(auth)/login');
    }

    SplashScreen.hideAsync();

  }, [user, segments, router, isSessionLoading, fontsLoaded]);

  if (isSessionLoading || !fontsLoaded) {
    return null;
  }

  return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen
              name="calibration-details/[calibrationId]"
              options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
  );
}