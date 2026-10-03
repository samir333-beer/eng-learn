import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import { AuthField } from '@/components/auth/AuthField';
import { AuthFooterLink } from '@/components/auth/AuthFooterLink';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ResetCodeFields } from '@/components/auth/ResetCodeFields';
import { FadeIn } from '@/components/ui/FadeIn';
import { AppButton } from '@/components/ui/AppButton';
import { useResetPassword } from '@/hooks/useResetPassword';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const {
    step,
    email,
    setEmail,
    code,
    setCode,
    codeStatus,
    newPassword,
    setNewPassword,
    emailError,
    sendingCode,
    codeError,
    passwordError,
    resetting,
    resendIn,
    resending,
    canResend,
    sendCode,
    resendCode,
    resetPassword,
    goBackToEmail,
    clearFieldError,
  } = useResetPassword();

  // Пошаговая навигация «назад»:
  // шаг 'email' (экран 2) → router.back() вернёт на вход (экран 1);
  // шаг 'reset' (экран 3) → goBackToEmail() вернёт на шаг 'email',
  // перескок через шаг невозможен.
  const handleBack = () => {
    if (step === 'reset') {
      goBackToEmail();
    } else {
      router.back();
    }
  };

  // Перехват системной кнопки «назад» на Android: с шага 'reset' возвращаемся
  // на шаг 'email', а не сразу на вход.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'reset') {
        goBackToEmail();
        return true; // отменяем стандартную навигацию (ушла бы на вход)
      }
      return false; // стандартная навигация: экран 2 → вход
    });
    return () => subscription.remove();
  }, [step, goBackToEmail]);

  return (
    <AuthScreen backdrop={<AuthBackdrop />}>
      <FadeIn>
        <AuthHeader
          icon="key-outline"
          title="Сброс пароля"
          subtitle={
            step === 'email'
              ? 'Введите email — отправим код восстановления'
              : 'Введите код из письма и новый пароль'
          }
          onBack={handleBack}
        />
      </FadeIn>

      <FadeIn delay={100}>
        <View style={styles.form}>
          {step === 'email' ? (
            <AuthField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!sendingCode}
              error={emailError || undefined}
            />
          ) : (
            <ResetCodeFields
              code={code}
              // setCode из хука чистит цифры и прошлую ошибку сам.
              onChangeCode={(v) => setCode(v.replace(/[^0-9]/g, ''))}
              codeStatus={codeStatus}
              codeError={codeError}
              newPassword={newPassword}
              onChangeNewPassword={(v) => {
                setNewPassword(v);
                clearFieldError('newPassword');
              }}
              passwordError={passwordError}
              canResend={canResend}
              resendIn={resendIn}
              resending={resending}
              onResend={resendCode}
              resetting={resetting}
            />
          )}
        </View>
      </FadeIn>

      <FadeIn delay={200}>
        {step === 'email' ? (
          <AppButton
            title={sendingCode ? 'Отправка…' : 'Отправить код'}
            onPress={sendCode}
            loading={sendingCode}
            style={styles.submit}
          />
        ) : (
          <AppButton
            title={resetting ? 'Сохранение…' : 'Сбросить пароль'}
            onPress={resetPassword}
            loading={resetting}
            style={styles.submit}
          />
        )}

        <AuthFooterLink
          text="Вспомнили пароль?"
          linkText="Войти"
          href="/(auth)/login"
        />
      </FadeIn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
    marginBottom: 28,
  },
  submit: {
    marginBottom: 8,
  },
});
