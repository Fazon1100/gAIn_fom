import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DbProvider } from '../context/DbProvider';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider>
      <DbProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'gAIn' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen
              name="session/[id]"
              options={{ title: 'Training', presentation: 'card' }}
            />
            <Stack.Screen name="template/[id]" options={{ title: 'Workout-Plan' }} />
            <Stack.Screen
              name="exercise/[id]"
              options={{ title: 'Übung', presentation: 'card' }}
            />
          </Stack>
        </ThemeProvider>
      </DbProvider>
    </SafeAreaProvider>
  );
}
