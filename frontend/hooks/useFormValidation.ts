import { useCallback, useState } from 'react';

/** Регулярка email — та же, что использовалась на экранах авторизации. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Общие валидаторы полей авторизации.
 * Возвращают текст ошибки или пустую строку, если значение валидно.
 */
export const validators = {
  email: (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Введите email';
    if (!EMAIL_REGEX.test(trimmed)) return 'Введите корректный email';
    return '';
  },

  /** Пароль: пусто → «Введите пароль», короче min → подсказка о длине. */
  password: (minLength: number) => (value: string): string => {
    if (!value) return 'Введите пароль';
    if (value.length < minLength) {
      return `Пароль должен быть не менее ${minLength} символов`;
    }
    return '';
  },

  /** Имя пользователя: пусто → «Введите имя», короче min → подсказка о длине. */
  name: (minLength: number) => (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Введите имя';
    if (trimmed.length < minLength) {
      return `Имя должно быть не менее ${minLength} символов`;
    }
    return '';
  },

  /** Код подтверждения из письма: ровно 6 цифр. */
  code: (value: string): string => {
    if (!/^\d{6}$/.test(value.trim())) return 'Введите 6-значный код из письма';
    return '';
  },
};

type FieldName = string;

/**
 * Общий хук валидации форм авторизации.
 *
 * Паттерн «кнопка всегда активна» (эталон — экран сброса пароля):
 * - validate(values) вызывается по нажатию кнопки: проставляет inline-ошибки
 *   под полями и возвращает true, только если все поля валидны;
 * - clearError(field) вызывается в onChangeText — ошибка исчезает при вводе;
 * - setError(field, text) — для ошибок от бэкенда (тоже под полем).
 */
export function useFormValidation<
  T extends Record<FieldName, (value: string) => string>,
>(
  fieldValidators: T,
) {
  type Keys = keyof T & FieldName;

  const [errors, setErrors] = useState<Partial<Record<Keys, string>>>({});

  /** Очистить ошибку одного поля (при вводе текста пользователем). */
  const clearError = useCallback((field: Keys) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  }, []);

  /** Поставить ошибку поля вручную (например, от бэкенда). */
  const setError = useCallback((field: Keys, text: string) => {
    setErrors((prev) => ({ ...prev, [field]: text }));
  }, []);

  /**
   * Проверить поля формы. Возвращает true, если все проверяемые поля валидны.
   * Невалидные поля получают текст ошибки под собой.
   * Второй аргумент — какие поля проверять (для пошаговых форм);
   * без него проверяются все поля.
   * Валидаторы могут замыкаться на другие поля формы (например,
   * «повтор пароля» сверяется с паролем) — поэтому в deps.
   */
  const validate = useCallback(
    (values: Record<Keys, string>, fields?: Keys[]): boolean => {
      const keysToCheck = fields ?? (Object.keys(fieldValidators) as Keys[]);
      const next: Partial<Record<Keys, string>> = {};
      let valid = true;
      for (const field of keysToCheck) {
        const message = fieldValidators[field](values[field]);
        if (message) {
          next[field] = message;
          valid = false;
        }
      }
      setErrors(next);
      return valid;
    },
    [fieldValidators],
  );

  return { errors, validate, clearError, setError };
}
