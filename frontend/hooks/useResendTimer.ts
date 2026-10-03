import { useCallback, useEffect, useState } from 'react';

/**
 * Таймер повторной отправки кода: обратный отсчёт + флаг «отправляем».
 * Используется на экранах регистрации и сброса пароля.
 */
export function useResendTimer(seconds: number) {
  const [resendIn, setResendIn] = useState(seconds);
  const [resending, setResending] = useState(false);

  // Обратный отсчёт до повторной отправки.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /** Выполняет отправку и перезапускает отсчёт. Ошибки пробрасывает наружу. */
  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setResending(true);
      try {
        await action();
        setResendIn(seconds);
      } finally {
        setResending(false);
      }
    },
    [seconds],
  );

  return { resendIn, resending, run };
}
