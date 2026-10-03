import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useThemePalette } from '@/hooks/use-theme-palette';

export type OtpStatus = 'idle' | 'loading' | 'valid' | 'invalid';

/**
 * Одна ячейка кода: пружинный «отскок» при заполнении + подсветка активной.
 *
 * Производительность:
 * - memo — при вводе цифры перерисовывается только изменившаяся ячейка,
 *   остальные пять получают те же пропсы и пропускают рендер;
 * - в useAnimatedStyle вычисляется только дешёвое: цвет рамки и scale
 *   (transform) — оба работают на UI-потоке без перерисовки вью;
 * - никаких теней (shadow/elevation) — на Android каждая анимированная
 *   тень заставляет перерисовывать вью целиком.
 */
export const OtpCell = memo(function OtpCell({
  digit,
  active,
  status,
}: {
  digit: string;
  active: boolean;
  status: OtpStatus;
}) {
  const p = useThemePalette();
  const pop = useSharedValue(0);
  const prevDigit = useRef(digit);

  // Цифра появилась — короткий пружинный «pop» с плавным затуханием одной
  // цепочкой (без колбэка, который мог не сработать при быстром вводе).
  // Цифра исчезла — жёстко сбрасываем анимацию, чтобы пустая ячейка
  // никогда не оставалась подсвеченной.
  useEffect(() => {
    if (digit && !prevDigit.current) {
      pop.value = withSequence(
        withSpring(1, { damping: 9, stiffness: 400 }),
        withTiming(0, { duration: 160 }),
      );
    } else if (!digit && prevDigit.current) {
      cancelAnimation(pop);
      pop.value = 0;
    }
    prevDigit.current = digit;
  }, [digit, pop]);

  const cellStyle = useAnimatedStyle(() => {
    const borderColor =
      status === 'invalid'
        ? p.danger
        : status === 'valid'
          ? p.accent
          : interpolateColor(
              active ? 1 : pop.value,
              [0, 1],
              [p.border, p.primary],
            );
    return {
      borderColor,
      backgroundColor: active || digit ? '#FFFFFF' : p.card,
      transform: [{ scale: 1 + pop.value * 0.1 + (active ? 0.03 : 0) }],
      opacity: status === 'loading' ? 0.7 : 1,
    };
  });

  const showCaret = active && !digit && status === 'idle';

  return (
    <Animated.View style={[styles.cell, cellStyle]}>
      {digit ? (
        <Text style={[styles.digit, { color: p.text }]}>{digit}</Text>
      ) : showCaret ? (
        <BlinkingCaret color={p.primary} />
      ) : null}
    </Animated.View>
  );
});

/** Мигающий курсор в активной ячейке — как в нативных OTP-инпутах.
 *  Компонент монтируется только когда ячейка активна (showCaret),
 *  поэтому бесконечная анимация не висит в фоне впустую. */
function BlinkingCaret({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(opacity);
      opacity.value = 1;
    };
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.caret, { backgroundColor: color }, style]} />;
}

const CELL = 48;

const styles = StyleSheet.create({
  cell: {
    width: CELL,
    height: CELL + 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 2,
    height: 24,
    borderRadius: 1,
  },
});
