import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  error?: string;
  hint?: string;
};

/**
 * Строка под полем ввода: красная ошибка с иконкой или серая подсказка.
 * memo — рендерится только при смене текста, не на каждый ввод.
 */
export const AuthFieldFooter = memo(function AuthFieldFooter({ error, hint }: Props) {
  const p = useThemePalette();

  if (error) {
    return (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle" size={14} color={p.danger} />
        <Text style={[styles.errorText, { color: p.danger }]}>{error}</Text>
      </View>
    );
  }
  if (hint) {
    return <Text style={[styles.hintText, { color: p.textMuted }]}>{hint}</Text>;
  }
  return null;
});

const styles = StyleSheet.create({
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  hintText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
});
