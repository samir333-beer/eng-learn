import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { forgotPassword, resetPassword } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';

const RESEND_SECONDS = 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ResetPasswordStep = 'email' | 'reset';

export function useResetPassword() {
  const router = useRouter();

  const [step, setStep] = useState<ResetPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 state
  const [emailError, setEmailError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  // Step 2 state
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetting, setResetting] = useState(false);

  // Resend timer
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 'reset') return;
    setResendIn(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const validateEmail = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Введите email';
    if (!EMAIL_REGEX.test(trimmed)) return 'Введите корректный email';
    return '';
  };

  const handleSendCode = async () => {
    setEmailError('');
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setSendingCode(true);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (e) {
      setEmailError(getApiError(e, 'Не удалось отправить код'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendIn > 0 || resending) return;
    setEmailError('');
    setResending(true);
    try {
      await forgotPassword(email.trim());
      setResendIn(RESEND_SECONDS);
      timerRef.current = setInterval(() => {
        setResendIn((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert('Ошибка', getApiError(e, 'Не удалось отправить код повторно'));
    } finally {
      setResending(false);
    }
  };

  const isResetValid =
    /^\d{6}$/.test(code.trim()) && newPassword.length >= 8;

  const handleResetPassword = async () => {
    setCodeError('');
    setPasswordError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('Введите 6-значный код из письма');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Пароль должен быть не короче 8 символов');
      return;
    }

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
        setPasswordError(message);
      } else {
        Alert.alert('Ошибка', message);
      }
    } finally {
      setResetting(false);
    }
  };

  const canResend = resendIn === 0 && !resending;

  return {
    step,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    showPassword,
    setShowPassword,
    emailError,
    setEmailError,
    sendingCode,
    codeError,
    setCodeError,
    passwordError,
    setPasswordError,
    resetting,
    resendIn,
    resending,
    isResetValid,
    canResend,
    sendCode: handleSendCode,
    resendCode: handleResendCode,
    resetPassword: handleResetPassword,
  };
}