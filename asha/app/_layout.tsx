import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import theme from '../src/theme';
import { store } from '../src/store';
import { useColorScheme } from '@/components/useColorScheme';
import { authService } from '../src/services/api';
import { initDatabase } from '../src/database';
import { secureStorage } from '../src/services/secureStorage';
import { encryptionService } from '../src/services/encryption';
import { auditLog } from '../src/services/auditLog';
import '../src/i18n'; // Initialize i18n


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

  // Initialize database and security services
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize services in order
        await encryptionService.initialize();
        await secureStorage.initialize();
        await initDatabase();
        
        // Start audit logging session
        auditLog.startNewSession();
        await auditLog.logSecurityEvent('app_initialized', 'info', {
          platform: Platform.OS,
          version: '1.0.0'
        });
        
        console.log('App services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app services:', error);
        await auditLog.logSecurityEvent('app_init_failed', 'critical', {
          error: (error as Error).message
        });
      }
    };
    
    initApp();
  }, []);

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
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <RootLayoutNav />
      </PaperProvider>
    </Provider>
  );
}

function RootLayoutNav() {

  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check secure storage for authentication
        const user = await authService.checkAuth();
        const inAuthGroup = segments[0] === 'auth';

        // Only navigate if we're not already in the right place
        if (!user && !inAuthGroup) {
          // Not authenticated and not in auth group, redirect to OTP login
          router.replace('/auth/otp-login');
        } else if (user && inAuthGroup) {
          // Authenticated but in auth group, redirect to home
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On error, redirect to login
        if (segments[0] !== 'auth') {
          router.replace('/auth/otp-login');
        }
      } finally {
        setIsReady(true);
      }
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


