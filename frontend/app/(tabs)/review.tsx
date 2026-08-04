import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { AppButton } from '@/components/ui/AppButton';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Screen } from '@/components/ui/Screen';
import { useThemePalette } from '@/hooks/use-theme-palette';
import {
  fetchSRSReview,
  fetchSRSStats,
  submitSRSReview,
  type SRSCardItem,
  type SRSStats,
} from '@/lib/api/srs';

export default function ReviewScreen() {
  const p = useThemePalette();
  const [cards, setCards] = useState<SRSCardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<SRSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [review, s] = await Promise.all([fetchSRSReview(20), fetchSRSStats()]);
      setCards(review.items);
      setStats(s);
      setIndex(0);
      setRevealed(false);
      setSessionDone(review.items.length === 0);
      setCorrectCount(0);
    } catch {
      setCards([]);
      setSessionDone(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = cards[index];

  const onAnswer = async (quality: 0 | 1) => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await submitSRSReview(current.card_id, quality);
      if (quality === 1) setCorrectCount((c) => c + 1);
      if (index + 1 >= cards.length) {
        setSessionDone(true);
      } else {
        setIndex((i) => i + 1);
        setRevealed(false);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={p.primary} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  if (sessionDone) {
    return (
      <Screen scroll>
        <Text style={[styles.title, { color: p.text }]}>Повторение</Text>
        <View style={[styles.doneCard, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[styles.doneEmoji, { color: p.accent }]}>🎉</Text>
          <Text style={[styles.doneTitle, { color: p.text }]}>
            {cards.length > 0 ? 'Сессия завершена!' : 'На сегодня всё готово!'}
          </Text>
          {cards.length > 0 ? (
            <Text style={[styles.doneSub, { color: p.textMuted }]}>
              Правильных ответов: {correctCount} из {cards.length}
            </Text>
          ) : (
            <Text style={[styles.doneSub, { color: p.textMuted }]}>
              Новых карточек нет. Возвращайтесь завтра!
            </Text>
          )}
          <AppButton title="Начать заново" onPress={load} style={{ marginTop: 16 }} />
        </View>
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen>
        <Text style={{ color: p.textMuted, textAlign: 'center', marginTop: 40 }}>
          Нет карточек для повторения
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: p.text }]}>Повторение</Text>
      <Text style={[styles.sub, { color: p.textMuted }]}>
        Карточка {index + 1} из {cards.length}
      </Text>

      {stats ? (
        <View style={[styles.statsRow, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={{ color: p.textMuted, fontSize: 12 }}>
            Повторить: {stats.due_cards} · Новых: {stats.new_cards} · Выучено: {stats.learned_cards}
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.primary }]}>
        <View style={styles.row}>
          <LevelBadge level={current.level} />
          {current.is_new ? (
            <Text style={[styles.newBadge, { color: p.accent }]}>Новая</Text>
          ) : null}
        </View>
        <Text style={[styles.en, { color: p.text }]}>{current.en}</Text>
        {revealed ? (
          <Text style={[styles.ru, { color: p.textMuted }]}>{current.ru}</Text>
        ) : (
          <AppButton
            title="Показать перевод"
            variant="ghost"
            onPress={() => {
              setRevealed(true);
              Speech.speak(current.en, { language: 'en-US' });
            }}
            style={{ marginTop: 8 }}
          />
        )}
      </View>

      {revealed ? (
        <View style={styles.actions}>
          <AppButton
            title="Не знаю"
            variant="ghost"
            onPress={() => onAnswer(0)}
            loading={submitting}
            style={{ flex: 1 }}
          />
          <AppButton
            title="Знаю ✓"
            onPress={() => onAnswer(1)}
            loading={submitting}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { fontSize: 14, marginBottom: 12 },
  statsRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    gap: 12,
    marginVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newBadge: { fontSize: 12, fontWeight: '700' },
  en: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  ru: { fontSize: 17, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  doneCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  doneSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});