import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import theme from '../src/theme';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/api';


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <RootLayoutNav />
    </PaperProvider>
  );
}

function RootLayoutNav() {

  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      const inAuthGroup = segments[0] === 'auth';

      const user = (token || isLoggedIn === 'true') ? await authService.checkAuth() : null;

      if (!user && !inAuthGroup) {
        // Not authenticated and not in auth group, redirect to login
        router.replace('/auth/login');
      } else if (user && inAuthGroup) {
        // Authenticated but in auth group, redirect to home
        router.replace('/(tabs)');
      }

      setIsReady(true);
    };
    initAuth();
  }, [segments]);


  if (!isReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="patient/type-select" options={{ title: 'Select Patient Type', presentation: 'modal' }} />
        <Stack.Screen name="patient/register/index" options={{ title: 'Register Patient', presentation: 'modal' }} />
        <Stack.Screen name="referral/new" options={{ title: 'New Referral', presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}


