import { Redirect } from 'expo-router';
import { ActivityIndicator, Button, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, isLoading, sessionError, retrySession } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (sessionError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          gap: 12,
        }}
      >
        <Text>Не удалось подключиться к серверу</Text>
        <Button title="Повторить" onPress={retrySession} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
