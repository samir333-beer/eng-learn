import { StyleSheet, Text, View } from 'react-native';

import { LevelBadge } from '@/components/ui/LevelBadge';
import type { Phrase } from '@/lib/api/phrases';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  phrase: Phrase | null;
  loading?: boolean;
};

export function PhraseCard({ phrase, loading }: Props) {
  const p = useThemePalette();

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text style={{ color: p.textMuted }}>Загрузка…</Text>
      </View>
    );
  }

  if (!phrase) {
    return (
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text style={{ color: p.textMuted, fontSize: 16 }}>
          Нажмите «Новая фраза», чтобы начать
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={styles.row}>
        <LevelBadge level={phrase.level} />
        <Text style={[styles.topic, { color: p.textMuted }]}>{phrase.topic}</Text>
      </View>
      <Text style={[styles.en, { color: p.text }]}>{phrase.en}</Text>
      <Text style={[styles.ru, { color: p.textMuted }]}>{phrase.ru}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topic: { fontSize: 13, textTransform: 'capitalize' },
  en: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  ru: { fontSize: 17, lineHeight: 24 },
});
