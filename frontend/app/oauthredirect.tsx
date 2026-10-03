import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';

/**
 * Защитный обработчик deep link `ingich://oauthredirect?...`.
 *
 * Когда Google возвращает пользователя в приложение, deep link может быть
 * перехвачен Expo Router (а не только expo-auth-session). Без этого экрана
 * Router показывает "Unmatched Route", потому что файла-обработчика для пути
 * `oauthredirect` в app/ не существует.
 *
 * Что происходит здесь:
 * - Нативный code flow уже обработан expo-auth-session (response вернулся через
 *   WebBrowser.openAuthSessionAsync, id_token извлечён в useGoogleAuth, логин уже
 *   выполнен). В query-параметрах в этом случае лежит только `code`, поэтому
 *   экран просто перенаправляет на корень.
 * - Если в параметрах всё же оказался `id_token` (web/proxy-флоу), передаём его
 *   в существующую логику входа (signInWithGoogle), чтобы пользователь
 *   гарантированно оказался залогинен.
 *
 * В любом случае завершаем `router.replace('/')`, чтобы пользователь не видел
 * "Unmatched Route", а маршрутизация продолжилась через index/(tabs).
 */
export default function OAuthRedirectScreen() {
  const params = useLocalSearchParams<{ id_token?: string; code?: string }>();
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      const idToken = params.id_token;
      if (idToken) {
        try {
          await signInWithGoogle(idToken);
        } catch {
          // Логин через Google уже мог быть обработан на экране входа;
          // ошибку здесь показывать нечему — просто уходим на корень.
        }
      }
      router.replace('/');
    })();
  }, [params.id_token, router, signInWithGoogle]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}