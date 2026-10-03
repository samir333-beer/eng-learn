import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import { AuthError } from '@/components/auth/AuthError';
import { AuthField } from '@/components/auth/AuthField';
import { AuthFooterLink } from '@/components/auth/AuthFooterLink';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthSocial } from '@/components/auth/AuthSocial';
import { AppButton } from '@/components/ui/AppButton';
import { FadeIn } from '@/components/ui/FadeIn';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import { getApiError } from '@/lib/errors';
import { loadRememberedEmail, saveRememberedEmail } from '@/lib/storage/email';
import { useThemePalette } from '@/hooks/use-theme-palette';

export default function LoginScreen() {
  const { signInPassword, signInWithGoogle, isLoading: authLoading } = useAuth();
  const p = useThemePalette();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // Кнопка всегда активна: валидация — по нажатию, ошибки под полями.
  const { errors, validate, clearError, setError: setFieldError } =
    useFormValidation({
      email: validators.email,
      password: validators.password(1),
    });

  useEffect(() => {
    loadRememberedEmail().then((rememberedEmail) => {
      if (rememberedEmail) setEmail(rememberedEmail);
    });
  }, []);

  const onSubmit = async () => {
    setError('');
    if (!validate({ email, password })) return;
    const normalizedEmail = email.trim();
    setSubmitting(true);
    try {
      await signInPassword(normalizedEmail, password);
      await saveRememberedEmail(normalizedEmail);
    } catch (e) {
      setFieldError('password', getApiError(e, 'Ошибка входа'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle(idToken);
    } catch (e) {
      setError(getApiError(e, 'Ошибка входа через Google'));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Screen backdrop={<AuthBackdrop />} glow={false}>
        <ActivityIndicator size="large" color={p.primary} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  return (
    <AuthScreen backdrop={<AuthBackdrop />}>
      <FadeIn>
        <AuthHeader
          icon="lock-closed-outline"
          title="Вход"
          subtitle="Продолжи свою серию — слова ждут"
        />
      </FadeIn>

      <FadeIn delay={100}>
        <View style={styles.form}>
          <AuthField
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearError('email');
              if (error) setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email || undefined}
          />

          <AuthField
            label="Пароль"
            icon="lock-closed-outline"
            placeholder="Ваш пароль"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearError('password');
              if (error) setError('');
            }}
            secure
            autoComplete="current-password"
            textContentType="password"
            ref={passwordRef}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            error={errors.password || undefined}
          />
        </View>

        <Link href="/(auth)/reset-password" style={[styles.forgotLink, { color: p.primary }]}>
          Забыли пароль?
        </Link>

        {error ? <AuthError message={error} /> : null}
      </FadeIn>

      <FadeIn delay={200}>
        <AppButton
          title={submitting ? 'Вход…' : 'Войти'}
          onPress={onSubmit}
          loading={submitting}
          style={styles.submit}
        />

        <AuthSocial
          onSuccess={handleGoogleSuccess}
          loading={googleLoading}
          dividerText="или войдите через"
        />

        <AuthFooterLink
          text="Ещё нет аккаунта?"
          linkText="Зарегистрироваться"
          href="/(auth)/register"
        />
      </FadeIn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
    marginBottom: 4,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 12,
    marginBottom: 4,
  },
  submit: {
    marginBottom: 28,
  },
});
