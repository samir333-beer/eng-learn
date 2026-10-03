import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { OtpCell, type OtpStatus } from '@/components/auth/otp/OtpCell';
import { useThemePalette } from '@/hooks/use-theme-palette';

export type { OtpStatus } from '@/components/auth/otp/OtpCell';

type Props = {
  value: string;
  onChangeText: (digits: string) => void;
  length?: number;
  status?: OtpStatus;
  editable?: boolean;
  /** Вызывается, когда код введён целиком. */
  onFilled?: (code: string) => void;
};

/**
 * Сегментированный ввод 6-значного кода.
 * Скрытый TextInput перехватывает ввод (включая вставку и автозаполнение из SMS),
 * ячейки анимируются при заполнении, тактильный отклик на каждую цифру.
 *
 * Производительность:
 * - ячейки memo-изированы (см. otp/OtpCell) — ввод цифры не перерисовывает
 *   остальные ячейки;
 * - обработчики обёрнуты в useCallback — ререндер не создаёт новые функции
 *   и не сбрасывает memo-сравнения;
 * - сама обёртка Pressable статична и не анимируется.
 */
export function OtpInput({
  value,
  onChangeText,
  length = 6,
  status = 'idle',
  editable = true,
  onFilled,
}: Props) {
  const p = useThemePalette();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Видимость клавиатуры: на Android системная кнопка «назад» (или свайп)
  // прячет её, НЕ снимая фокус с поля — onBlur не вызывается, и поле
  // остаётся «сфокусированным» без клавиатуры.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const digits = value.replace(/\D/g, '').slice(0, length).split('');
  const activeIndex = Math.min(digits.length, length - 1);

  const handleChange = useCallback(
    (text: string) => {
      const next = text.replace(/\D/g, '').slice(0, length);
      if (next.length > value.length && editable) {
        Haptics.selectionAsync().catch(() => {});
      }
      onChangeText(next);
      if (next.length === length) {
        onFilled?.(next);
      }
    },
    [length, value.length, editable, onChangeText, onFilled],
  );

  const focusInput = useCallback(() => {
    if (!editable) return;
    const input = inputRef.current;
    if (!input) return;

    if (input.isFocused() && !keyboardVisible) {
      // Фокус «залип» без клавиатуры (Android back): повторный focus() —
      // no-op и клавиатура не вернётся. blur + focus форсируют её показ.
      input.blur();
      requestAnimationFrame(() => input.focus());
      return;
    }
    if (!input.isFocused()) {
      input.focus();
    }
    // Фокус есть и клавиатура открыта — ничего не делаем (без мигания).
  }, [editable, keyboardVisible]);

  return (
    <Pressable onPress={focusInput} style={styles.wrap}>
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => (
          <OtpCell
            key={i}
            digit={digits[i] ?? ''}
            active={focused && editable && i === activeIndex}
            status={status}
          />
        ))}
      </View>

      {/* Скрытый ввод: невидим, но получает фокус, вставку и SMS-автозаполнение */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        editable={editable}
        caretHidden
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={p.primary}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
