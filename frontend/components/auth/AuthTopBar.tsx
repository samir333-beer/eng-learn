import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  onBack: () => void;
  /** Номер текущего шага (1-based) и всего шагов — для индикатора точек. */
  step: number;
  totalSteps: number;
};

/**
 * Шапка экранов регистрации: кнопка «назад» слева + индикатор шагов
 * справа («●○ Шаг 1 из 2»). Полностью статична — ноль анимаций.
 *
 * Верхний отступ задаётся контейнером AuthScreen (topRow), поэтому здесь
 * marginBottom отсутствует — высота строки одинакова на всех экранах.
 */
export function AuthTopBar({ onBack, step, totalSteps }: Props) {
  const p = useThemePalette();

  return (
    <View style={styles.topBar}>
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

      <View style={[styles.steps, { backgroundColor: p.card }]}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < step ? p.primary : p.border },
            ]}
          />
        ))}
        <Text style={[styles.stepsText, { color: p.textMuted }]}>
          Шаг {step} из {totalSteps}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
});
