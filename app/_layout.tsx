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


// Previne que a splash screen desapareça
SplashScreen.preventAutoHideAsync();



function RootLayoutNav() {
  // 1. Get the new session loading state
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
    // 2. Don't do anything until the auth state is hydrated
    if (isSessionLoading || !fontsLoaded) {
      return;
    }

    const inTabsGroup = segments[0] === '(app)'; // Make sure this matches your folder

    if (user && !inTabsGroup) {
      // Redireciona para a tela principal se o usuário estiver logado
      router.replace('/'); // Use the layout route name
    } else if (!user) {
      // Redireciona para a tela de login se o usuário não estiver logado.
      router.replace('/(auth)/login');
    }

    // 3. Hide the splash screen ONLY after we are done loading and have navigated
    SplashScreen.hideAsync();

  }, [user, segments, router, isSessionLoading, fontsLoaded]); // 4. Add isSessionLoading to dependencies

  // 5. Don't render the navigator until we are ready
  if (isSessionLoading || !fontsLoaded) {
    return null;
  }

  return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
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