import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LevelBadge } from '@/components/ui/LevelBadge';
import { Screen } from '@/components/ui/Screen';
import { LevelColors } from '@/constants/design';
import { fetchPhrasesPage, type Phrase } from '@/lib/api/phrases';
import { useThemePalette } from '@/hooks/use-theme-palette';

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2'] as const;
const PAGE = 25;

export default function ExploreScreen() {
  const p = useThemePalette();
  const [level, setLevel] = useState('');
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPhrasesPage({
        skip: 0,
        limit: PAGE,
        level: level || undefined,
      });
      setPhrases(data.items);
      setTotal(data.total);
    } catch {
      setPhrases([]);
    } finally {
      setLoading(false);
    }
  }, [level]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    if (phrases.length >= total) return;
    setLoadingMore(true);
    try {
      const data = await fetchPhrasesPage({
        skip: phrases.length,
        limit: PAGE,
        level: level || undefined,
      });
      setPhrases((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, phrases.length, total, level]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Text style={[styles.title, { color: p.text }]}>Словарь</Text>
      <Text style={[styles.meta, { color: p.textMuted }]}>{total} фраз</Text>

      <View style={styles.filters}>
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

      {loading ? (
        <ActivityIndicator color={p.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={phrases}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={p.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: p.card, borderColor: p.border }]}>
              <View style={styles.row}>
                <LevelBadge level={item.level} />
                <Text style={{ color: p.textMuted, fontSize: 12 }}>{item.topic}</Text>
              </View>
              <Text style={[styles.en, { color: p.text }]}>{item.en}</Text>
              <Text style={{ color: p.textMuted }}>{item.ru}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: p.textMuted, textAlign: 'center', marginTop: 24 }}>
              Нет фраз
            </Text>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800' },
  meta: { marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  item: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  en: { fontSize: 16, fontWeight: '600' },
});
