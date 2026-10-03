import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import { AuthError } from '@/components/auth/AuthError';
import { AuthField } from '@/components/auth/AuthField';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthTopBar } from '@/components/auth/AuthTopBar';
import { AppButton } from '@/components/ui/AppButton';
import { FadeIn } from '@/components/ui/FadeIn';
import { useAuth } from '@/context/AuthContext';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import {
  clearPendingRegistration,
  getPendingRegistration,
} from '@/lib/auth/pendingRegistration';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

const PASSWORD_MIN_LENGTH = 6;
const NAME_MIN_LENGTH = 3;

/**
 * Шаг 3/3 регистрации: имя + пароль (без «Повторите пароль» —
 * есть иконка показа/скрытия и подсказка о минимальной длине).
 *
 * Подтверждённый на шаге 2 код берётся из памяти модуля (не из URL)
 * и уходит одним запросом signUp — тот же эндпоинт, бэкенд не меняется.
 * Кнопка всегда активна: валидация по нажатию, ошибки под полями.
 */
export default function RegisterDetailsScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const p = useThemePalette();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [codeExpired, setCodeExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // Кнопка всегда активна: валидация — по нажатию, ошибки под полями.
  const { errors, validate, clearError, setError: setFieldError } =
    useFormValidation({
      username: validators.name(NAME_MIN_LENGTH),
      password: validators.password(PASSWORD_MIN_LENGTH),
    });

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('./register');
    }
  }, [router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  const onRegister = useCallback(async () => {
    setError('');
    setCodeExpired(false);
    const pending = getPendingRegistration();
    if (!pending) {
      setError('Код не подтверждён — вернитесь на шаг с кодом');
      return;
    }
    if (!validate({ username, password })) return;
    setLoading(true);
    try {
      await signUp(pending.email, pending.code, username.trim(), password.trim());
      clearPendingRegistration();
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const message = getApiError(e, 'Ошибка регистрации');
      if (status === 400) {
        // Код истёк или уже был использован — предлагаем ввести новый.
        clearPendingRegistration();
        setCodeExpired(true);
        setError('Код истёк или уже использован — запросите новый');
      } else if (message.toLowerCase().includes('занят')) {
        // «Имя пользователя уже занято» — под поле имени.
        setFieldError('username', message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [username, password, signUp, validate, setFieldError]);

  return (
    <AuthScreen
      backdrop={<AuthBackdrop />}
      top={<AuthTopBar onBack={handleBack} step={3} totalSteps={3} />}>
      <FadeIn>
        <AuthHeader
          icon="person-outline"
          title="Почти готово"
          subtitle="Придумайте имя и пароль — и аккаунт готов"
        />
      </FadeIn>

      <FadeIn delay={100}>
        <View style={styles.form}>
          <AuthField
            label="Имя пользователя"
            icon="person-outline"
            placeholder="Как вас называть?"
            value={username}
            onChangeText={(v) => {
              setUsername(v);
              clearError('username');
              if (error) setError('');
            }}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            hint={`Минимум ${NAME_MIN_LENGTH} символа`}
            error={errors.username || undefined}
          />

          <AuthField
            ref={passwordRef}
            label="Пароль"
            icon="lock-closed-outline"
            placeholder="Придумайте пароль"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              clearError('password');
              if (error) setError('');
            }}
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={onRegister}
            hint={`Минимум ${PASSWORD_MIN_LENGTH} символов`}
            error={errors.password || undefined}
          />
        </View>

        {error ? <AuthError message={error} /> : null}

        <AppButton
          title={loading ? 'Создание аккаунта…' : 'Создать аккаунт'}
          onPress={onRegister}
          loading={loading}
          style={styles.submit}
        />

        {codeExpired ? (
          <AppButton
            title="Ввести код заново"
            variant="ghost"
            onPress={handleBack}
            style={styles.reenter}
          />
        ) : (
          <Text style={[styles.note, { color: p.textMuted }]}>
            Email и код уже подтверждены на прошлом шаге
          </Text>
        )}
      </FadeIn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
    marginBottom: 4,
  },
  submit: {
    marginTop: 8,
    marginBottom: 8,
  },
  reenter: {
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    textAlign: 'center',
  },
});
