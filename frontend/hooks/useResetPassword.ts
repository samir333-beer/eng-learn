import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { forgotPassword, resetPassword } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';
import { useCodeVerification } from '@/hooks/useCodeVerification';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import { useResendTimer } from '@/hooks/useResendTimer';

const RESEND_SECONDS = 60;

/** Минимальная длина нового пароля при сбросе (как на бэкенде). */
const NEW_PASSWORD_MIN_LENGTH = 8;

export type ResetPasswordStep = 'email' | 'reset';

export function useResetPassword() {
  const router = useRouter();

  const [step, setStep] = useState<ResetPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 state
  const [sendingCode, setSendingCode] = useState(false);

  // Step 2 state
  const [resetting, setResetting] = useState(false);

  // Общий хук валидации — та же логика ошибок, что и на остальных
  // экранах авторизации: ошибки под полями, проверка по нажатию кнопки.
  const {
    errors,
    validate,
    clearError,
    setError: setFieldError,
  } = useFormValidation({
    email: validators.email,
    code: validators.code,
    newPassword: validators.password(NEW_PASSWORD_MIN_LENGTH),
  });

  // Живая проверка кода сброса — тот же хук, что и в регистрации
  // (purpose='reset'): ячейки краснеют/зеленеют сразу после 6-й цифры.
  const {
    code,
    status: codeStatus,
    verified: codeVerified,
    error: verifyError,
    handleChange: handleCodeChange,
    reset: resetCodeVerification,
  } = useCodeVerification(email, 'reset');

  // Локальная ошибка кода — только от финального запроса reset-password
  // (живая проверка уже закрыла случай неверного кода до нажатия кнопки).
  const [codeError, setCodeError] = useState('');

  // Таймер повторной отправки кода.
  const { resendIn, resending, run: runResend } = useResendTimer(RESEND_SECONDS);

  const handleSendCode = async () => {
    clearError('email');
    // Шаг 1 — проверяем только email, поля шага 2 не трогаем.
    if (!validate({ email, code, newPassword }, ['email'])) return;
    setSendingCode(true);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (e) {
      setFieldError('email', getApiError(e, 'Не удалось отправить код'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendIn > 0 || resending) return;
    setCodeError('');
    // Новый код сделает старый недействительным — очищаем ввод, как в регистрации.
    handleCodeChange('');
    resetCodeVerification();
    try {
      await runResend(() => forgotPassword(email.trim()));
    } catch (e) {
      Alert.alert('Ошибка', getApiError(e, 'Не удалось отправить код повторно'));
    }
  };

  // Печать цифр идёт через живую проверку; заодно чистим ошибку прошлой попытки.
  const setCode = useCallback(
    (raw: string) => {
      setCodeError('');
      handleCodeChange(raw);
    },
    [handleCodeChange],
  );

  const handleResetPassword = async () => {
    setCodeError('');
    // Шаг 2 — проверяем код и новый пароль по нажатию кнопки.
    if (!validate({ email, code, newPassword }, ['code', 'newPassword'])) return;

    setResetting(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert('Пароль изменён', 'Теперь вы можете войти с новым паролем.', [
        { text: 'ОК', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const message = getApiError(e, 'Не удалось сбросить пароль');
      if (status === 400) {
        setCodeError(message);
      } else if (status === 422) {
        setFieldError('newPassword', message);
      } else {
        Alert.alert('Ошибка', message);
      }
    } finally {
      setResetting(false);
    }
  };

  const canResend = resendIn === 0 && !resending;

  // Stepwise back navigation: from step 'reset' (screen 3) return to step 'email' (screen 2).
  // This keeps the flow strictly stepwise — the user must go through the email step
  // before reaching the login screen, never skipping a step.
  const goBackToEmail = useCallback(() => {
    setStep('email');
    handleCodeChange('');
    resetCodeVerification();
    setNewPassword('');
    setCodeError('');
    setFieldError('code', '');
    setFieldError('newPassword', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    step,
    email,
    setEmail,
    code,
    setCode,
    codeStatus,
    codeVerified,
    newPassword,
    setNewPassword,
    showPassword,
    setShowPassword,
    emailError: errors.email ?? '',
    sendingCode,
    // Живая ошибка (неверный код) + ошибка от финального запроса.
    codeError: codeError || verifyError,
    passwordError: errors.newPassword ?? '',
    resetting,
    resendIn,
    resending,
    canResend,
    sendCode: handleSendCode,
    resendCode: handleResendCode,
    resetPassword: handleResetPassword,
    goBackToEmail,
    // Очистка ошибки поля при вводе (для onChangeText на экране).
    clearFieldError: clearError,
  };
}
