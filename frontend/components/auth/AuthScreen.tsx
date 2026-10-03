import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Screen } from '@/components/ui/Screen';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';

/**
 * Высота и отступ верхней строки (шапка «назад + Шаг N из M»).
 * Заданы один раз здесь: AuthScreen всегда резервирует эту строку,
 * поэтому иконка AuthHeader на всех экранах стоит на одном расстоянии
 * от верха — даже там, где нет ни кнопки «назад», ни индикатора шагов.
 */
export const AUTH_TOP_ROW_HEIGHT = 44;
export const AUTH_TOP_ROW_MARGIN = 8;

type Props = {
  /** Всегда видимый блок сверху (шапка «назад + Шаг N из M», прогресс). */
  top?: ReactNode;
  /** Декоративный блок (hero-иллюстрация, чипы, подзаголовки) —
   *  плавно сворачивается при открытой клавиатуре. */
  decorative?: ReactNode;
  /** Основной контент (форма, кнопка, ссылки). */
  children: ReactNode;
  backdrop?: ReactNode;
};

/**
 * Обёртка экранов авторизации поверх Screen.
 *
 * Поведение при открытой клавиатуре:
 * - декоративный блок плавно схлопывается по высоте (reanimated, 220 мс) —
 *   место освобождается под форму, поле в фокусе и кнопку действия;
 * - скролл: тапы по кнопкам работают (keyboardShouldPersistTaps="handled"),
 *   свайп закрывает клавиатуру (keyboardDismissMode="on-drag").
 *
 * Декоративный блок всегда в layout (не unmount): при закрытии клавиатуры
 * он плавно разворачивается обратно без потери состояния/анимаций.
 *
 * Верхняя строка (topRow) рендерится всегда и имеет фиксированную высоту —
 * это единый отступ шапки на всех пяти экранах авторизации.
 */
export function AuthScreen({ top, decorative, children, backdrop }: Props) {
  const keyboardVisible = useKeyboardVisible();

  // Прогресс компактного режима: 0 — полный, 1 — свёрнутый.
  const collapse = useSharedValue(0);
  // Фактическая высота декоративного блока (измеряется onLayout).
  const measuredHeight = useSharedValue(0);

  useEffect(() => {
    collapse.value = withTiming(keyboardVisible ? 1 : 0, { duration: 220 });
  }, [keyboardVisible, collapse]);

  const decorativeStyle = useAnimatedStyle(() => ({
    // Высота интерполируется от измеренной до 0 — блок схлопывается,
    // освобождая место под форму; opacity гасит содержимое одновременно.
    height: interpolate(
      collapse.value,
      [0, 1],
      [measuredHeight.value, 0],
    ),
    opacity: 1 - collapse.value,
  }));

  return (
    <Screen
      scroll
      backdrop={backdrop}
      glow={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <View style={styles.topRow}>{top ?? null}</View>
      {decorative ? (
        <Animated.View
          collapsable={false}
          style={[styles.decorative, decorativeStyle]}>
          {/* Замер естественной высоты — на внутреннем View: у внешнего
              высота анимируется, onLayout там вернул бы схлопнутое значение. */}
          <View
            collapsable={false}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) {
                measuredHeight.value = h;
              }
            }}>
            {decorative}
          </View>
        </Animated.View>
      ) : null}
      <View collapsable={false}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    height: AUTH_TOP_ROW_HEIGHT,
    marginBottom: AUTH_TOP_ROW_MARGIN,
    justifyContent: 'center',
  },
  decorative: {
    overflow: 'hidden',
  },
});
