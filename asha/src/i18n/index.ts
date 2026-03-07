import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import bn from './locales/bn.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  bn: { translation: bn },
};

// Get device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    // Map device language to supported languages
    const supportedLanguages = ['en', 'hi', 'ta', 'te', 'bn'];
    return supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'hi';
  }
  return 'hi'; // Default to Hindi
};

// Get saved language or device language
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user_language');
    return savedLanguage || getDeviceLanguage();
  } catch (error) {
    return getDeviceLanguage();
  }
};

// Initialize i18n with async language detection
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'hi', // Fallback to Hindi
      
      interpolation: {
        escapeValue: false, // React already does escaping
      },
      
      react: {
        useSuspense: false, // Disable suspense for React Native
      },
      
      // Enable debugging in development
      debug: __DEV__,
    });
};

// Initialize immediately
initI18n();

export default i18n;

// Language options for UI
export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिंदी', nativeName: 'Hindi' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil' },
  { code: 'te', name: 'తెలుగు', nativeName: 'Telugu' },
  { code: 'bn', name: 'বাংলা', nativeName: 'Bengali' },
];

// Helper function to change language
export const changeLanguage = async (languageCode: string) => {
  await i18n.changeLanguage(languageCode);
  await AsyncStorage.setItem('user_language', languageCode);
};