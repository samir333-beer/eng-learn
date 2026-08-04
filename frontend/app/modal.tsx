import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { LevelColors } from '@/constants/design';
import { useWords } from '@/context/WordsContext';
import { useThemePalette } from '@/hooks/use-theme-palette';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

export default function AddWordModal() {
  const router = useRouter();
  const p = useThemePalette();
  const { addWord } = useWords();

  const [en, setEn] = useState('');
  const [ru, setRu] = useState('');
  const [level, setLevel] = useState<string>('');
  const [error, setError] = useState('');

  const onSubmit = () => {
    setError('');

    if (!en.trim()) {
      setError('Введите английское слово');
      return;
    }
    if (!ru.trim()) {
      setError('Введите перевод на русский');
      return;
    }
    if (!level) {
      setError('Выберите уровень сложности');
      return;
    }

    addWord(en, ru, level);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <Text style={[styles.title, { color: p.text }]}>Добавить новое слово</Text>
      <Text style={[styles.subtitle, { color: p.textMuted }]}>
        Добавьте слово в свою коллекцию, и оно появится в разделе «Карточки».
      </Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: p.text }]}>Английское слово</Text>
        <TextInput
          value={en}
          onChangeText={setEn}
          placeholder="Например, apple"
          placeholderTextColor={p.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            { backgroundColor: p.card, color: p.text, borderColor: p.border },
          ]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: p.text }]}>Перевод на русский</Text>
        <TextInput
          value={ru}
          onChangeText={setRu}
          placeholder="Например, яблоко"
          placeholderTextColor={p.textMuted}
          style={[
            styles.input,
            { backgroundColor: p.card, color: p.text, borderColor: p.border },
          ]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: p.text }]}>Уровень сложности</Text>
        <View style={styles.levels}>
          {LEVELS.map((lvl) => {
            const active = level === lvl;
            const color = LevelColors[lvl] ?? p.primary;
            return (
              <Pressable
                key={lvl}
                onPress={() => setLevel(lvl)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? `${color}33` : p.card,
                    borderColor: active ? color : p.border,
                  },
                ]}>
                <Text style={{ color: active ? color : p.textMuted, fontWeight: '700' }}>
                  {lvl}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: p.danger }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <AppButton title="Сохранить" onPress={onSubmit} style={styles.button} />
        <AppButton
          title="Отмена"
          variant="ghost"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: { gap: 10, marginTop: 'auto', paddingBottom: 24 },
  button: { width: '100%' },
});