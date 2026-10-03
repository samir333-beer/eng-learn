import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

/**
 * Хук входа через Google.
 *
 * На нативных платформах expo-auth-session (7.x) намеренно использует
 * authorization code flow (ResponseType.Code): Google не отдаёт id_token напрямую
 * для Android/iOS OAuth-клиентов. После возврата из браузера библиотека
 * автоматически обменивает `code` на токены (PKCE) и кладёт id_token в
 * `response.params.id_token` / `response.authentication.idToken`.
 *
 * Redirect URI генерируется библиотекой автоматически через makeRedirectUri():
 * - Development build: `${applicationId}:/oauthredirect` = `com.samir.ingich:/oauthredirect`
 *   (схема com.samir.ingich зарегистрирована expo-router в AndroidManifest)
 * - Expo Go: через Linking.createURL с scheme из app.json
 *
 * Хук следит за ответом и возвращает id_token, который затем отправляется
 * на бэкенд (POST /auth/google).
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Все три client id обязательны: библиотека выбирает нужный по платформе
    // (web -> webClientId, iOS -> iosClientId, Android -> androidClientId)
    // и бросает ошибку "...ClientId must be defined", если он не передан.
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type !== 'success') return;

    // В этой версии expo-auth-session (7.x) id_token лежит в query-параметрах
    // ответа (response.params.id_token), а после автообмена кода также
    // доступен в response.authentication?.idToken.
    const token = response.params.id_token ?? response.authentication?.idToken;
    if (token) {
      setIdToken(token);
    }
  }, [response]);

  return {
    promptAsync,
    idToken,
    // true, пока auth-запрос ещё не загружен (кнопка входа недоступна).
    loading: request === null,
  };
}
