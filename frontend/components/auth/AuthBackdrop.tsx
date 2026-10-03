import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

/**
 * Статичный «aurora»-фон для экранов авторизации.
 *
 * Анимаций здесь НЕТ намеренно: большие полупрозрачные градиентные пятна —
 * самое тяжёлое, что можно анимировать на слабом GPU (каждый кадр —
 * перерисовка оффскрин-слоя). Статичный градиент выглядит так же дорого,
 * но не создаёт фоновой нагрузки, и вся остальная анимация идёт плавно.
 */
export const AuthBackdrop = memo(function AuthBackdrop() {
  const p = useThemePalette();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Верхнее пятно — фирменный индиго */}
      <View style={styles.blobTop}>
        <LinearGradient
          colors={[`${p.primary}2E`, `${p.primary}00`]}
          style={styles.fill}
        />
      </View>

      {/* Правое пятно — фиолетовый акцент градиента */}
      <View style={styles.blobRight}>
        <LinearGradient
          colors={['#8B5CF622', '#8B5CF600']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fill}
        />
      </View>

      {/* Лёгкая розовая подсветка снизу — глубина без тяжести */}
      <LinearGradient
        colors={['#EC48990E', 'transparent']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.6 }}
        style={styles.bottomGlow}
      />
    </View>
  );
});

const BLOB = 320;

const styles = StyleSheet.create({
  blobTop: {
    position: 'absolute',
    top: -BLOB / 2.6,
    left: -BLOB / 3,
    width: BLOB,
    height: BLOB,
    borderRadius: BLOB / 2,
    overflow: 'hidden',
  },
  blobRight: {
    position: 'absolute',
    top: 120,
    right: -BLOB / 2.4,
    width: BLOB * 0.9,
    height: BLOB * 0.9,
    borderRadius: BLOB,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
  },
});
