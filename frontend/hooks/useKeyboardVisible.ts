import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Флаг видимости клавиатуры.
 *
 * На iOS слушаем keyboardWill* — событие приходит ДО анимации, поэтому
 * компактный режим экрана стартует одновременно с клавиатурой.
 * На Android Will-события не гарантированы — используем keyboardDid*.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
