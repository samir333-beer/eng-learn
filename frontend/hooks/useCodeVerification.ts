import { useCallback, useRef, useState } from 'react';

import { verifyRegistrationCode } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';
import type { OtpStatus } from '@/components/auth/OtpInput';

/**
 * Живая проверка кода подтверждения: как только введены все цифры —
 * запрос уходит автоматически, без нажатия кнопок.
 *
 * Изолирует состояние статуса/ошибки и гонку запросов (requestId):
 * «висящий» медленный ответ на старый код не перебивает свежий.
 */
export function useCodeVerification(
  email: string | undefined,
  purpose: 'register' | 'reset' = 'register',
) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<OtpStatus>('idle');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const handleChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 6);
      setCode(digits);
      setError('');
      if (!email) return;

      const id = ++requestId.current;

      if (digits.length === 6) {
        setStatus('loading');
        setVerified(false);
        verifyRegistrationCode(email, digits, purpose)
          .then(() => {
            if (requestId.current !== id) return;
            setStatus('valid');
            setVerified(true);
          })
          .catch((err) => {
            if (requestId.current !== id) return;
            setStatus('invalid');
            setVerified(false);
            setError(getApiError(err, 'Проверьте код и попробуйте ещё раз.'));
          });
      } else {
        // Меньше 6 цифр — сбрасываем статус и отменяем «висящий» запрос.
        setStatus('idle');
        setVerified(false);
      }
    },
    [email, purpose],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setVerified(false);
  }, []);

  return { code, status, verified, error, handleChange, reset };
}
