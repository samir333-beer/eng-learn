import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import { AuthError } from '@/components/auth/AuthError';
import { AuthField } from '@/components/auth/AuthField';
import { AuthFooterLink } from '@/components/auth/AuthFooterLink';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthSocial } from '@/components/auth/AuthSocial';
import { AuthTopBar } from '@/components/auth/AuthTopBar';
import { AppButton } from '@/components/ui/AppButton';
import { FadeIn } from '@/components/ui/FadeIn';
import { useAuth } from '@/context/AuthContext';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import { sendEmailCode } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';

/** Задержки стаггер-появления блоков экрана (мс). */
const DELAY = {
  topBar: 0,
  form: 160,
  cta: 240,
  social: 320,
} as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Кнопка всегда активна: валидация — по нажатию, ошибка под полем.
  const { errors, validate, clearError, setError: setFieldError } =
    useFormValidation({
      email: validators.email,
    });

  // Разовое пружинное появление кнопки без бесконечной пульсации:
  // постоянный scale на градиентной кнопке давал фоновую нагрузку GPU.
  const ctaScale = useSharedValue(0.9);

  useEffect(() => {
    ctaScale.value = withDelay(
      DELAY.cta,
      withSpring(1, { damping: 14, stiffness: 180 }),
    );
  }, [ctaScale]);

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

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

  const onSendCode = async () => {
    setError('');
    if (!validate({ email })) return;
    const normalizedEmail = email.trim();
    setLoading(true);
    try {
      await sendEmailCode(normalizedEmail, 'register');
      // Клавиатура email-раскладки на экране кода бесполезна: гасим её перед
      // сменой экрана. OtpInput сам поднимет цифровую клавиатуру (autoFocus).
      Keyboard.dismiss();
      // Push (а не replace): системная кнопка «назад» вернёт на этот экран.
      router.push(`./register-code?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (e) {
      setFieldError('email', getApiError(e, 'Не удалось отправить код'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      backdrop={<AuthBackdrop />}
      top={
        <FadeIn delay={DELAY.topBar}>
          <AuthTopBar onBack={() => router.back()} step={1} totalSteps={3} />
        </FadeIn>
      }>
      <FadeIn>
        <AuthHeader
          icon="mail-outline"
          title="Создай аккаунт"
          subtitle="Введите email — отправим код подтверждения"
        />
      </FadeIn>

      <FadeIn delay={DELAY.form}>
        <AuthField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clearError('email');
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={onSendCode}
          error={errors.email || undefined}
          containerStyle={styles.field}
        />

        {error ? <AuthError message={error} /> : null}
      </FadeIn>

      <FadeIn delay={DELAY.cta}>
        <Animated.View style={[styles.cta, ctaStyle]}>
          <AppButton
            title={loading ? 'Отправка кода…' : 'Продолжить'}
            onPress={onSendCode}
            loading={loading}
          />
        </Animated.View>
      </FadeIn>

      <FadeIn delay={DELAY.social}>
        <AuthSocial
          onSuccess={handleGoogleSuccess}
          loading={googleLoading}
          dividerText="или зарегистрируйтесь через"
        />

        <AuthFooterLink text="Уже есть аккаунт?" linkText="Войти" href="/(auth)/login" />
      </FadeIn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  cta: {
    marginBottom: 28,
  },
});

