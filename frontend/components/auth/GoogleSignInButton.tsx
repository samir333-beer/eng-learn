import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { SocialIcon } from '@/components/ui/SocialIcon';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  /** Вызывается с полученным id_token, чтобы родитель отправил его на бэкенд. */
  onSuccess: (idToken: string) => void | Promise<void>;
  /** Внешний флаг загрузки (например, пока идёт запрос к бэкенду). */
  loading?: boolean;
};

export function GoogleSignInButton({ onSuccess, loading = false }: Props) {
  const p = useThemePalette();
  const { promptAsync, idToken, loading: authLoading } = useGoogleAuth();
  const [submitting, setSubmitting] = useState(false);
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (idToken && notifiedRef.current !== idToken) {
      notifiedRef.current = idToken;
      void onSuccess(idToken);
    }
  }, [idToken, onSuccess]);

  const onPress = async () => {
    if (authLoading || submitting || loading) return;
    try {
      setSubmitting(true);
      await promptAsync();
    } catch {
      // Окно входа ещё не готово или пользователь прервал процесс — игнорируем.
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = authLoading || submitting || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { borderColor: p.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {submitting || loading ? (
        <ActivityIndicator color="#1A1A1A" />
      ) : (
        <>
          <SocialIcon provider="google" size={20} />
          <Text style={styles.text}>Войти через Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    minWidth: 140,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
