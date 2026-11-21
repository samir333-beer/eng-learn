import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, Text, View } from 'react-native';

import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import { AuthError } from '@/components/auth/AuthError';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthTopBar } from '@/components/auth/AuthTopBar';
import { EmailChip } from '@/components/auth/EmailChip';
import { OtpInput } from '@/components/auth/OtpInput';
import { ResendRow } from '@/components/auth/ResendRow';
import { AppButton } from '@/components/ui/AppButton';
import { FadeIn } from '@/components/ui/FadeIn';
import { useCodeVerification } from '@/hooks/useCodeVerification';
import { useResendTimer } from '@/hooks/useResendTimer';
import { sendEmailCode } from '@/lib/api/auth';
import {
  clearPendingRegistration,
  getPendingRegistration,
  setPendingRegistration,
} from '@/lib/auth/pendingRegistration';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

const RESEND_SECONDS = 60;

/**
 * Шаг 2/3 регистрации: только код из письма.
 * Код подтверждается «живьём» (useCodeVerification) — как только все 6 цифр
 * введены и проверены, экран автоматически переходит на шаг 3 (имя + пароль).
 * Сам код на шаг 3 передаётся через память модуля, а не через URL.
 *
 * Возврат с шага 3 (кнопка «назад») оставляет пользователя здесь — с зелёными
 * ячейками, плашкой почты («Изменить» работает) и кнопкой «Продолжить».
 * Повторный автопереход при возврате не срабатывает: он привязан к факту
 * ввода 6-й цифры (useEffect по verified), а не к фокусу экрана.
 */
export default function RegisterCodeScreen() {
  const router = useRouter();
  const p = useThemePalette();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const { resendIn, resending, run: runResend } = useResendTimer(RESEND_SECONDS);

  const {
    code,
    status: codeStatus,
    verified,
    error: codeError,
    handleChange: handleCodeChange,
  } = useCodeVerification(email);

  // При вводе всех 6 цифр сразу сохраняем код в памяти модуля — к моменту
  // успешной проверки он уже готов к передаче на шаг 3 (без URL).
  // Неполный код (пользователь стёр цифру) — подтверждение недействительно,
  // память очищаем: «Продолжить» пропадёт вместе с verified.
  const onCodeChange = useCallback(
    (raw: string) => {
      handleCodeChange(raw);
      const digits = raw.replace(/\D/g, '').slice(0, 6);
      if (digits.length === 6 && email) {
        setPendingRegistration(email, digits);
      } else {
        clearPendingRegistration();
      }
    },
    [handleCodeChange, email],
  );

  // «Изменить» (плашка почты) и «назад» в шапке ведут на шаг 1.
  // Старое подтверждение кода не должно «протечь» на следующий заход
  // (возможно, с другим email) — очищаем память; экран шага 1 монтирует
  // шаг 2 заново, поэтому ячейки пустые и таймер стартует заново.
  const cancelPush = useRef<() => void>(() => {});

  const handleBack = useCallback(() => {
    cancelPush.current();
    clearPendingRegistration();
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

  // Выход из флоу регистрации — забываем подтверждённый код.
  useEffect(() => () => clearPendingRegistration(), []);

  // Автопереход — ровно один раз, сразу после успешной проверки 6-й цифры.
  // При возврате с шага 3 verified не меняется, поэтому эффект не
  // перезапускается и пользователь спокойно остаётся на шаге 2.
  //
  // Переход разнесён на два кадра намеренно. Раньше push вызывался в том же
  // коммите, что и setStatus('valid'): на слабых Android одновременный пик
  // нагрузки (перерисовка 6 ячеек + монтирование нового экрана с градиентами
  // и FadeIn + slide-анимация + скрытие клавиатуры) давал заметный рывок.
  // Теперь сначала отрисовываются зелёные ячейки, клавиатура гасится, и лишь
  // затем монтируется следующий экран.
  const navigatedRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPushTimer = useCallback(() => {
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }
  }, []);

  cancelPush.current = clearPushTimer;

  useEffect(() => {
    if (!verified) {
      // Код сброшен (resend/«Ввести код заново») — разрешаем автопереход снова.
      navigatedRef.current = false;
      clearPushTimer();
      setAdvancing(false);
      return;
    }
    if (navigatedRef.current) return;
    const pending = getPendingRegistration();
    if (!pending) return;
    navigatedRef.current = true;
    setAdvancing(true);

    // Цифровая клавиатура на следующем экране не нужна: гасим её здесь,
    // иначе на Android она схлопывается уже поверх нового экрана — лишний
    // layout-проход ровно в момент анимации перехода.
    Keyboard.dismiss();

    pushTimer.current = setTimeout(() => {
      pushTimer.current = null;
      router.push(`./register-details?email=${encodeURIComponent(pending.email)}`);
    }, 220);
  }, [verified, router, clearPushTimer]);

  // Экран ушёл (или размонтирован) — не оставляем висящий таймер.
  useEffect(() => clearPushTimer, [clearPushTimer]);

  // Возврат на экран (в т.ч. с шага 3): автоперехода сейчас нет — снимаем
  // подсказку «переходим дальше…», остаются зелёные ячейки и кнопка
  // «Продолжить». Если код был сброшен («Ввести код заново»), память пуста,
  // а локальная проверка ещё «зелёная» — сбрасываем её, чтобы пользователь
  // ввёл новый код (ячейки не остались подтверждёнными зря).
  const verifiedRef = useRef(verified);
  verifiedRef.current = verified;
  useFocusEffect(
    useCallback(() => {
      setAdvancing(false);
      if (verifiedRef.current && !getPendingRegistration()) {
        handleCodeChange('');
      }
    }, [handleCodeChange]),
  );

  // Ручной переход на шаг 3 (нужен после возврата с шага 3, когда автопереход
  // уже отработал). Кнопка без disabled: валидация по нажатию.
  const onContinue = () => {
    setError('');
    const pending = getPendingRegistration();
    if (!verified || !pending) {
      setError('Сначала введите код из письма');
      return;
    }
    Keyboard.dismiss();
    router.push(`./register-details?email=${encodeURIComponent(pending.email)}`);
  };

  const onResendCode = async () => {
    setError('');
    // Новый код сделает старый недействительным — очищаем ввод и память.
    handleCodeChange('');
    clearPendingRegistration();
    try {
      await runResend(() => sendEmailCode(email, 'register'));
    } catch (e) {
      setError(getApiError(e, 'Не удалось отправить код'));
    }
  };

  return (
    <AuthScreen
      backdrop={<AuthBackdrop />}
      top={<AuthTopBar onBack={handleBack} step={2} totalSteps={3} />}>
      <FadeIn>
        <AuthHeader
          icon="mail-outline"
          title="Код из письма"
          subtitle="Мы отправили 6-значный код на вашу почту"
        />
      </FadeIn>

      <EmailChip email={email} onChangeEmail={handleBack} />

      <FadeIn delay={100}>
        <View style={styles.otpBlock}>
          <OtpInput value={code} onChangeText={onCodeChange} status={codeStatus} />
          <Text style={[styles.otpHint, { color: p.textMuted }]}>
            {advancing
              ? 'Код верный — переходим дальше…'
              : 'Код отправлен на указанную почту'}
          </Text>
        </View>

        {error || codeError ? <AuthError message={error || codeError} /> : null}

        {/* Таймер повторной отправки — в самом низу, полностью виден:
            при открытой клавиатуре декоративный блок свёрнут, места достаточно. */}
        <ResendRow resendIn={resendIn} resending={resending} onResend={onResendCode} />

        {/* Ручной переход на шаг 3: виден только при подтверждённом коде.
            Нужен после возврата с шага 3, когда автопереход уже отработал. */}
        {verified ? (
          <AppButton title="Продолжить" onPress={onContinue} style={styles.submit} />
        ) : null}
      </FadeIn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  otpBlock: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  submit: {
    marginTop: 12,
  },
});
