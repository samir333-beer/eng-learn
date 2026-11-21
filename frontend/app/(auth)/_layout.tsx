import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      // freezeOnBlur: экран под новым «замерзает» — react-native-screens
      // перестаёт его перерисовывать во время перехода и после него. На слабых
      // Android это снимает заметную часть нагрузки: анимации OtpCell и
      // подписки клавиатуры нижнего экрана не работают, пока он не в фокусе.
      screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-code" />
      <Stack.Screen name="register-details" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}