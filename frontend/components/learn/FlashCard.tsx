import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { LevelBadge } from '@/components/ui/LevelBadge';
import type { Phrase } from '@/lib/api/phrases';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  phrase: Phrase | null;
  loading?: boolean;
};

export function FlashCard({ phrase, loading }: Props) {
  const p = useThemePalette();
  const [revealed, setRevealed] = useState(false);
  const flip = useSharedValue(0);

  useEffect(() => {
    setRevealed(false);
    flip.value = 0;
  }, [phrase?.id, flip]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const toggle = () => {
    if (!phrase || loading) return;
    const next = !revealed;
    setRevealed(next);
    flip.value = withTiming(next ? 1 : 0, { duration: 350 });
  };

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text style={{ color: p.textMuted }}>Загрузка карточки…</Text>
      </View>
    );
  }

  if (!phrase) {
    return (
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text style={{ color: p.textMuted, fontSize: 16, textAlign: 'center' }}>
          Нажмите «Новая карточка», чтобы начать игру
        </Text>
      </View>
    );
  }

  return (
    <Pressable onPress={toggle} style={styles.wrap}>
      <Animated.View
        style={[
          styles.card,
          styles.face,
          { backgroundColor: p.card, borderColor: p.primary },
          frontStyle,
        ]}>
        <View style={styles.row}>
          <LevelBadge level={phrase.level} />
          <Text style={[styles.hint, { color: p.textMuted }]}>Нажмите, чтобы перевернуть</Text>
        </View>
        <Text style={[styles.main, { color: p.text }]}>{phrase.en}</Text>
        <Text style={[styles.side, { color: p.primary }]}>Англ → Рус</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          styles.face,
          styles.back,
          { backgroundColor: p.card, borderColor: p.accent },
          backStyle,
        ]}>
        <View style={styles.row}>
          <LevelBadge level={phrase.level} />
          <Text style={[styles.topic, { color: p.textMuted }]}>{phrase.topic}</Text>
        </View>
        <Text style={[styles.main, { color: p.text }]}>{phrase.ru}</Text>
        <Text style={[styles.side, { color: p.accent }]}>{phrase.en}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 260, marginVertical: 16 },
  card: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    gap: 16,
  },
  face: { backfaceVisibility: 'hidden' },
  back: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { fontSize: 12 },
  topic: { fontSize: 13, textTransform: 'capitalize' },
  main: { fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  side: { fontSize: 15, textAlign: 'center', fontWeight: '600' },
});
