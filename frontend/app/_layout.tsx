import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { WordsProvider } from '@/context/WordsContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WordsProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="flashcards" />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Добавить новое слово', headerShown: true }}
            />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </WordsProvider>
    </AuthProvider>
  );
}
