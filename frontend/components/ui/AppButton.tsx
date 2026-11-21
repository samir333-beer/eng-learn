import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useThemePalette } from '@/hooks/use-theme-palette';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Содержимое кнопки: в покое — текст, при загрузке — спиннер + текст.
 *  Текст остаётся видимым, поэтому «Отправка кода…» действительно читается
 *  пользователем, а не подменяется немым индикатором. */
function ButtonContent({
  loading,
  title,
  color,
  textStyle,
}: {
  loading?: boolean;
  title: string;
  color: string;
  textStyle: StyleProp<TextStyle>;
}) {
  if (!loading) {
    return <Text style={textStyle}>{title}</Text>;
  }
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator size="small" color={color} />
      <Text style={textStyle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

/** Пружинные параметры нажатия: быстрый отклик, мягкое возвращение. */
const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 } as const;
const RELEASE_SPRING = { damping: 16, stiffness: 260, mass: 0.8 } as const;

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'light';
  style?: ViewStyle;
  disabled?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  buttonRadius?: number;
};

export function AppButton({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
  disabled,
  gradientColors,
  buttonRadius = 16,
}: Props) {
  const p = useThemePalette();

  // Тактильно-визуальный отклик нажатия: scale-пружина + haptics.
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, PRESS_SPRING);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [disabled, loading, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, RELEASE_SPRING);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    // Только transform — самый дешёвый способ анимации на любом GPU.
    transform: [{ scale: scale.value }],
  }));

  if (variant === 'primary') {
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[
        styles.wrap,
        { borderRadius: buttonRadius },
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}>
      <LinearGradient
        colors={gradientColors ? gradientColors : p.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: buttonRadius }]}>
        <ButtonContent
          loading={loading}
          title={title}
          color="#fff"
          textStyle={styles.primaryText}
        />
      </LinearGradient>
    </AnimatedPressable>
  );
}

  if (variant === 'light') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[styles.lightButton, style, animatedStyle]}>
        <ButtonContent
          loading={loading}
          title={title}
          color="#333"
          textStyle={styles.lightButtonText}
        />
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[
        styles.ghost,
        {
          borderColor: variant === 'danger' ? p.danger : p.border,
          backgroundColor: p.card,
        },
        style,
        animatedStyle,
      ]}>
      <ButtonContent
        loading={loading}
        title={title}
        color={p.primary}
        textStyle={[
          styles.ghostText,
          { color: variant === 'danger' ? p.danger : p.text },
        ]}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  gradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lightButton: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
  },
  lightButtonText: { color: '#333333', fontSize: 16, fontWeight: '700' },
  ghost: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  ghostText: { fontSize: 16, fontWeight: '600' },
});
