import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { LevelBadge } from '@/components/ui/LevelBadge';
import { Screen } from '@/components/ui/Screen';
import { LevelColors } from '@/constants/design';
import { useWords, type UserWord } from '@/context/WordsContext';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { fetchPhrasesPage, type Phrase } from '@/lib/api/phrases';

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2'] as const;

type WordRow = (Phrase & { isCustom?: boolean }) | UserWord;

export default function CardsScreen() {
  const p = useThemePalette();
  const { customWords } = useWords();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPhrasesPage({ skip: 0, limit: 50, level: level || undefined });
      setPhrases(data.items);
    } catch {
      setPhrases([]);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    load();
  }, [load]);

  const items: WordRow[] = [
    ...(level ? customWords.filter((w) => w.level === level) : customWords),
    ...phrases,
  ];

  return (
    <Screen>
      <Text style={[styles.title, { color: p.text }]}>Карточки</Text>
      <Text style={[styles.sub, { color: p.textMuted }]}>Коллекция изучаемых слов. Всего: {items.length}</Text>

      <View style={styles.levels}>
        {LEVELS.map((lvl) => {
          const active = level === lvl;
          const color = lvl ? LevelColors[lvl] : p.primary;
          return (
            <Text
              key={lvl || 'all'}
              onPress={() => setLevel(lvl)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? `${color}33` : p.card,
                  borderColor: active ? color : p.border,
                  color: active ? color : p.textMuted,
                },
              ]}>
              {lvl || 'Все'}
            </Text>
          );
        })}
      </View>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: p.textMuted }]}>
            {loading ? 'Загрузка…' : 'Нет слов'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: p.card, borderColor: p.border }]}>
            <View style={styles.row}>
              <LevelBadge level={item.level} />
              {item.isCustom ? (
                <Text style={[styles.customBadge, { color: p.primary }]}>Моё слово</Text>
              ) : (
                <Text style={{ color: p.textMuted, fontSize: 12 }}>{item.topic}</Text>
              )}
            </View>
            <Text style={[styles.en, { color: p.text }]}>{item.en}</Text>
            <Text style={{ color: p.textMuted }}>{item.ru}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { fontSize: 14, marginBottom: 12 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  empty: { textAlign: 'center', marginTop: 24 },
  item: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customBadge: { fontSize: 12, fontWeight: '700' },
  en: { fontSize: 16, fontWeight: '600' },
});