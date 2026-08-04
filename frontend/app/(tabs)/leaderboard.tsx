import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import {
  fetchTimeLeaderboard,
  fetchWordsLeaderboard,
  type Leaderboard,
} from '@/lib/api/leaderboard';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Tab = 'words' | 'time';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m} мин`;
}

function medal(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const p = useThemePalette();
  const [tab, setTab] = useState<Tab>('words');
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const board = tab === 'words' ? await fetchWordsLeaderboard() : await fetchTimeLeaderboard();
      setData(board);
    } catch {
      setData(null);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.primary} />
      }>
      <Text style={[styles.title, { color: p.text }]}>Лидеры мира</Text>
      <Text style={[styles.sub, { color: p.textMuted }]}>Топ‑100 игроков по всему миру</Text>

      <View style={styles.tabs}>
        {([
          ['words', 'По словам'],
          ['time', 'По времени'],
        ] as const).map(([key, label]) => (
          <Text
            key={key}
            onPress={() => setTab(key)}
            style={[
              styles.tab,
              {
                color: tab === key ? p.primary : p.textMuted,
                borderBottomColor: tab === key ? p.primary : 'transparent',
                backgroundColor: tab === key ? `${p.primary}18` : p.card,
              },
            ]}>
            {label}
          </Text>
        ))}
      </View>

      {data?.my_rank ? (
        <View style={[styles.myRank, { backgroundColor: p.card, borderColor: p.primary }]}>
          <Text style={[styles.myRankTitle, { color: p.text }]}>Ваше место</Text>
          <Text style={[styles.myRankValue, { color: p.primary }]}>
            #{data.my_rank} ·{' '}
            {tab === 'words'
              ? `${data.my_value ?? 0} слов`
              : formatTime(data.my_value ?? 0)}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={p.primary} style={{ marginTop: 40 }} />
      ) : !data?.entries.length ? (
        <Text style={[styles.empty, { color: p.textMuted }]}>
          Пока никого в таблице. Будьте первым, @{user?.username}!
        </Text>
      ) : (
        <View style={[styles.list, { backgroundColor: p.card, borderColor: p.border }]}>
          {data.entries.map((entry) => {
            const isMe = entry.user_id === user?.id;
            return (
              <View
                key={`${entry.user_id}-${entry.rank}`}
                style={[
                  styles.row,
                  { borderBottomColor: p.border },
                  isMe && { backgroundColor: `${p.primary}12` },
                ]}>
                <Text style={[styles.rank, { color: p.text }]}>{medal(entry.rank)}</Text>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: p.text }]}>
                    {entry.username}
                    {isMe ? ' (вы)' : ''}
                  </Text>
                  <Text style={[styles.value, { color: p.textMuted }]}>
                    {tab === 'words' ? `${entry.value} слов` : formatTime(entry.value)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { fontSize: 14, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    fontWeight: '700',
    fontSize: 14,
    borderBottomWidth: 2,
    overflow: 'hidden',
  },
  myRank: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  myRankTitle: { fontSize: 13, fontWeight: '600' },
  myRankValue: { fontSize: 20, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15, lineHeight: 22 },
  list: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rank: { width: 36, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700' },
  value: { fontSize: 13 },
});
