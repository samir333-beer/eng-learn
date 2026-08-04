import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { AppButton } from '@/components/ui/AppButton';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { Screen } from '@/components/ui/Screen';
import { LevelColors } from '@/constants/design';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { fetchQuiz, type QuizQuestion } from '@/lib/api/quiz';

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2'] as const;

export default function PracticeScreen() {
  const p = useThemePalette();
  const [level, setLevel] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setFinished(false);
    setSelected(null);
    setScore(0);
    setIndex(0);
    try {
      const data = await fetchQuiz(level || undefined, 10);
      setQuestions(data.questions);
    } catch {
      setQuestions([]);
      setFinished(true);
    } finally {
      setLoading(false);
    }
  }, [level]);

  const current = questions[index];

  const onSelect = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    if (optionIndex === current.correct_index) {
      setScore((s) => s + 1);
    }
  };

  const onNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={p.primary} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen scroll>
        <Text style={[styles.title, { color: p.text }]}>Тренировка</Text>
        <View style={[styles.doneCard, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[styles.doneEmoji, { color: p.accent }]}>🏆</Text>
          <Text style={[styles.doneTitle, { color: p.text }]}>
            {questions.length > 0 ? 'Тренировка завершена!' : 'Не удалось загрузить вопросы'}
          </Text>
          {questions.length > 0 ? (
            <Text style={[styles.doneSub, { color: p.textMuted }]}>
              Правильных ответов: {score} из {questions.length}
            </Text>
          ) : null}
          <AppButton title="Начать заново" onPress={loadQuiz} style={{ marginTop: 16 }} />
        </View>
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen>
        <Text style={{ color: p.textMuted, textAlign: 'center', marginTop: 40 }}>
          Нажмите «Начать тренировку»
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: p.text }]}>Тренировка</Text>
      <Text style={[styles.sub, { color: p.textMuted }]}>
        Вопрос {index + 1} из {questions.length} · Счёт: {score}
      </Text>

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

      <View style={[styles.questionCard, { backgroundColor: p.card, borderColor: p.primary }]}>
        <View style={styles.row}>
          <LevelBadge level={current.level} />
          <Pressable onPress={() => Speech.speak(current.en, { language: 'en-US' })}>
            <Text style={{ color: p.primary, fontSize: 14, fontWeight: '600' }}>🔊 Озвучить</Text>
          </Pressable>
        </View>
        <Text style={[styles.en, { color: p.text }]}>{current.en}</Text>
        <Text style={[styles.hint, { color: p.textMuted }]}>Выберите правильный перевод:</Text>
      </View>

      <View style={styles.options}>
        {current.options.map((option, i) => {
          const isCorrect = i === current.correct_index;
          const isSelected = i === selected;
          let bg = p.card;
          let border = p.border;
          if (selected !== null) {
            if (isCorrect) {
              bg = `${p.accent}22`;
              border = p.accent;
            } else if (isSelected) {
              bg = `${p.danger}22`;
              border = p.danger;
            }
          }
          return (
            <Pressable
              key={`${current.phrase_id}-${i}`}
              onPress={() => onSelect(i)}
              disabled={selected !== null}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
              <Text style={[styles.optionText, { color: p.text }]}>{option}</Text>
              {selected !== null && isCorrect ? (
                <Text style={{ color: p.accent, fontWeight: '700' }}>✓</Text>
              ) : null}
              {selected !== null && isSelected && !isCorrect ? (
                <Text style={{ color: p.danger, fontWeight: '700' }}>✗</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {selected !== null ? (
        <AppButton
          title={index + 1 >= questions.length ? 'Завершить' : 'Следующий вопрос'}
          onPress={onNext}
          style={{ marginTop: 16 }}
        />
      ) : null}
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
  questionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    gap: 10,
    marginVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  en: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  hint: { fontSize: 13 },
  options: { gap: 10 },
  option: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: { fontSize: 15, flex: 1 },
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