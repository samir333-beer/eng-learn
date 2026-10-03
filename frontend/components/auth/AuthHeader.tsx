import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  AUTH_TOP_ROW_HEIGHT,
  AUTH_TOP_ROW_MARGIN,
} from '@/components/auth/AuthScreen';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  /** Если передан — слева сверху рисуется кнопка «назад». */
  onBack?: () => void;
};

/**
 * Единая шапка для всех экранов авторизации:
 * кнопка «назад» + иконка-бейдж + заголовок + подзаголовок.
 *
 * Кнопка «назад» абсолютная и «поднята» в верхнюю строку AuthScreen
 * (topRow): высота шапки не зависит от onBack, а иконка-бейдж на всех
 * пяти экранах стоит на одном расстоянии от верха. Отступ задан один раз —
 * константами AUTH_TOP_ROW_* в AuthScreen.
 */
export function AuthHeader({ icon, title, subtitle, onBack }: Props) {
  const p = useThemePalette();

  return (
    <View style={styles.wrap}>
      {onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.back,
            { backgroundColor: p.card },
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons name="chevron-back" size={22} color={p.text} />
        </Pressable>
      )}

      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: `${p.primary}14` }]}>
          <Ionicons name={icon} size={28} color={p.primary} />
        </View>
        <Text style={[styles.title, { color: p.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 28,
  },
  back: {
    position: 'absolute',
    // Поднимаем кнопку в зарезервированную верхнюю строку AuthScreen,
    // чтобы она стояла на одном уровне с кнопкой AuthTopBar.
    top: -(AUTH_TOP_ROW_HEIGHT + AUTH_TOP_ROW_MARGIN),
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
