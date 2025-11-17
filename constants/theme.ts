import { Platform } from 'react-native';

// NOSSAS NOVAS CORES "LEAN TECH"
const LEAN_BLUE = '#1A365D'; // Azul escuro do logo
const LEAN_GREEN = '#00A86B'; // Verde da seta

const tintColorLight = LEAN_BLUE;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1A202C', // Um cinza escuro, não preto puro
    textSecondary: '#8E8E93',
    background: '#F7FAFC', // Cinza muito claro
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    // Cores semânticas
    primary: LEAN_BLUE,
    accent: LEAN_GREEN,
    secondary: '#E2E8F0', // Um cinza para badges/fundos
    danger: '#E53E3E',   // Vermelho
    success: LEAN_GREEN, // Verde
    warning: '#DD6B20',  // Laranja
    border: '#CBD5E0',
    white: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#8E8E93',

    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // Cores semânticas (Dark)
    primary: '#5A9BDC', // Azul claro
    accent: '#38C172', // Verde claro
    secondary: '#2D3748',
    danger: '#FC8181',
    success: '#68D391',
    warning: '#F6AD55',
    border: '#4A5568',
    white: '#1A202C', // Cartões no modo escuro
  },
};

// ADICIONANDO NOSSAS FONTES
export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    sansBold: 'Inter_700Bold',
    sansSemiBold: 'Inter_600SemiBold',
  },
  android: {
    sans: 'Inter_400Regular',
    sansBold: 'Inter_700Bold',
    sansSemiBold: 'Inter_600SemiBold',
  },
  default: {
    sans: 'Inter_400Regular',
    sansBold: 'Inter_700Bold',
    sansSemiBold: 'Inter_600SemiBold',
  },
  web: {
    sans: "Inter_400Regular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    sansBold: "Inter_700Bold, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    sansSemiBold: "Inter_600SemiBold, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
});