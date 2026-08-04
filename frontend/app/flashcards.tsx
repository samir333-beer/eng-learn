import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { FlashCard } from '@/components/learn/FlashCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { LevelColors } from '@/constants/design';
import { useWords } from '@/context/WordsContext';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { fetchRandomPhrase, type Phrase } from '@/lib/api/phrases';

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2'] as const;

export default function FlashcardsScreen() {
  const router = useRouter();
  const p = useThemePalette();
  const insets = useSafeAreaInsets();
  const { customWords } = useWords();

  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [level, setLevel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);

  const loadPhrase = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchRandomPhrase(level || undefined);
      setPhrase(next);
    } finally {
      setLoading(false);
    }
  }, [level]);

  const onNext = () => {
    if (customWords.length > 0 && index < customWords.length) {
      setIndex((i) => i + 1);
    } else {
      loadPhrase();
    }
  };

  const custom = customWords[index] ?? null;
  const hasCustom = customWords.length > 0 && index < customWords.length;

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: p.card, borderColor: p.border },
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={8}>
          <IconSymbol name="chevron.right" size={20} color={p.text} style={styles.backIcon} />
          <Text style={[styles.backText, { color: p.text }]}>Назад</Text>
        </Pressable>
        <Text style={[styles.title, { color: p.text }]}>Флеш-карточки</Text>
        <View style={styles.headerSpacer} />
      </View>

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

      {hasCustom ? (
        <View style={styles.customCard}>
          <View style={styles.row}>
            <LevelBadge level={custom?.level ?? 'A1'} />
            <Text style={[styles.topic, { color: p.textMuted }]}>Моё слово</Text>
          </View>
          <Text style={[styles.en, { color: p.text }]}>{custom?.en}</Text>
          <Text style={[styles.ru, { color: p.textMuted }]}>{custom?.ru}</Text>
        </View>
      ) : (
        <FlashCard phrase={phrase} loading={loading} />
      )}

      <View style={styles.actions}>
        <AppButton
          title={hasCustom ? 'Следующее слово' : 'Следующая карточка'}
          onPress={onNext}
          loading={loading && !hasCustom}
        />
        {hasCustom ? (
          <AppButton
            title="Перейти к словам из каталога"
            variant="ghost"
            onPress={() => {
              setIndex(customWords.length);
              loadPhrase();
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  backIcon: { transform: [{ rotate: '180deg' }] },
  backText: { fontSize: 15, fontWeight: '700', marginLeft: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 74 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    fontWeight: '600',
    fontSize: 13,
  },
  customCard: {
    marginVertical: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#5B5FEF',
    backgroundColor: '#F2F3F5',
    gap: 10,
    minHeight: 260,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topic: { fontSize: 13 },
  en: { fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  ru: { fontSize: 17, textAlign: 'center', lineHeight: 24 },
  actions: { gap: 10, marginTop: 8 },
});