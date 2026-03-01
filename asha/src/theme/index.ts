import { MD3LightTheme, configureFonts } from 'react-native-paper';

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#006B5E', // A professional teal/green for healthcare
        secondary: '#4D635D',
        tertiary: '#3F6374',
        background: '#F8FAF9',
        surface: '#FFFFFF',
        error: '#BA1A1A',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#191C1B',
        onSurface: '#191C1B',
    },
};

export default theme;
