import { forwardRef, useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuthFieldFooter } from '@/components/auth/AuthFieldFooter';
import { useThemePalette } from '@/hooks/use-theme-palette';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export type AuthFieldStatus = 'idle' | 'valid' | 'invalid' | 'loading';

type Props = TextInputProps & {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Визуальный статус: иконка справа и цвет рамки. */
  status?: AuthFieldStatus;
  /** Текст ошибки под полем (рамка становится красной). */
  error?: string;
  /** Нейтральная подсказка под полем. */
  hint?: string;
  /** Показать кнопку «показать/скрыть пароль». */
  secure?: boolean;
  containerStyle?: ViewStyle;
};

/**
 * Единое поле ввода для экранов авторизации: лейбл, иконка, рамка с фокусом,
 * статус-иконка, переключатель видимости пароля, ошибка/подсказка снизу.
 * Рамка всегда одной толщины (меняется только цвет) — интерфейс не «прыгает».
 */
export const AuthField = forwardRef<TextInput, Props>(function AuthField({
  label,
  icon,
  status = 'idle',
  error,
  hint,
  secure,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}, ref) {
  const p = useThemePalette();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  // Прогресс фокуса 0→1: интерполируется ТОЛЬКО цвет рамки/иконки/лейбла.
  // Тени (shadow*/elevation) здесь НЕ анимируются сознательно: на Android
  // каждая перерисовка тени — перерисовка вью, это главный источник лагов.
  // Тень ставится статично по состоянию фокуса — дёшево и выглядит так же.
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 150 });
  }, [focused, focus]);

  const hasError = Boolean(error) || status === 'invalid';

  const rowStyle = useAnimatedStyle(() => {
    const borderColor = hasError
      ? p.danger
      : interpolateColor(focus.value, [0, 1], [p.border, p.primary]);
    return {
      borderColor,
    };
  });

  const iconProps = useAnimatedProps(() => ({
    color: hasError
      ? p.danger
      : interpolateColor(focus.value, [0, 1], [p.textMuted, p.primary]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: hasError
      ? p.danger
      : interpolateColor(focus.value, [0, 1], [p.textMuted, p.primary]),
  }));

  return (
    <View style={containerStyle}>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>

      <Animated.View
        collapsable={false}
        style={[
          styles.row,
          { backgroundColor: focused ? '#FFFFFF' : p.card },
          rowStyle,
        ]}>
        <AnimatedIonicons name={icon} size={20} animatedProps={iconProps} />

        <TextInput
          ref={ref}
          placeholderTextColor="#9AA4B8"
          selectionColor={p.primary}
          autoCapitalize="none"
          {...inputProps}
          secureTextEntry={secure ? !visible : inputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: p.text }, style]}
        />

        {status === 'loading' && (
          <ActivityIndicator size="small" color={p.primary} style={styles.status} />
        )}
        {status === 'valid' && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={p.accent}
            style={styles.status}
          />
        )}
        {status === 'invalid' && (
          <Ionicons
            name="close-circle"
            size={22}
            color={p.danger}
            style={styles.status}
          />
        )}

        {secure && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            style={styles.eye}>
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={p.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>

      <AuthFieldFooter error={error} hint={hint} />
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  status: {
    width: 24,
  },
  eye: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
