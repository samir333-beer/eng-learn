import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Screen } from '@/components/ui/Screen';
import { StatCard } from '@/components/ui/StatCard';
import { LevelColors } from '@/constants/design';
import { useAuth } from '@/context/AuthContext';
import { fetchMyStats, type UserStats } from '@/lib/api/stats';
import { useThemePalette } from '@/hooks/use-theme-palette';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const p = useThemePalette();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await fetchMyStats());
    } catch {
      setStats(null);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.primary} />
      }>
      <Text style={[styles.title, { color: p.text }]}>Профиль</Text>
      <Text style={[styles.email, { color: p.textMuted }]}>{user?.email}</Text>
      <Text style={[styles.user, { color: p.text }]}>@{user?.username}</Text>

      <View style={styles.grid}>
        <StatCard label="Выучено" value={stats?.phrases_learned ?? '—'} />
        <StatCard label="Просмотров" value={stats?.total_views ?? '—'} />
        <StatCard
          label="Прогресс"
          value={stats ? `${stats.progress_percent}%` : '—'}
          accent={p.accent}
        />
        <StatCard
          label="Время в приложении"
          value={
            stats
              ? `${Math.floor(stats.study_time_seconds / 60)} мин`
              : '—'
          }
        />
        <StatCard
          label="Серия дней"
          value={stats ? `🔥 ${stats.streak_days}` : '—'}
          accent={p.primary}
        />
      </View>

      {stats ? (
        <View style={[styles.block, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[styles.blockTitle, { color: p.text }]}>По уровням</Text>
          {Object.entries(stats.by_level).map(([lvl, count]) => (
            <View key={lvl} style={styles.levelRow}>
              <LevelBadge level={lvl} />
              <View style={[styles.barBg, { backgroundColor: p.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, (count / 40) * 100)}%`,
                      backgroundColor: LevelColors[lvl],
                    },
                  ]}
                />
              </View>
              <Text style={{ color: p.text, fontWeight: '700' }}>{count}</Text>
            </View>
          ))}
          <Text style={[styles.hint, { color: p.textMuted }]}>
            Всего в базе: {stats.total_phrases} фраз
          </Text>
        </View>
      ) : null}

      <AppButton title="Выйти" variant="danger" onPress={signOut} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  email: { fontSize: 14, marginTop: 4 },
  user: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  block: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  blockTitle: { fontSize: 18, fontWeight: '700' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  hint: { fontSize: 13, marginTop: 4 },
});
