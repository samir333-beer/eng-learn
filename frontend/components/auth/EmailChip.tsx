import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  email: string;
  onChangeEmail: () => void;
};

/** Чип с email: показывает, на какую почту отправлен код, с кнопкой «Изменить». */
export const EmailChip = memo(function EmailChip({ email, onChangeEmail }: Props) {
  const p = useThemePalette();

  return (
    <View style={[styles.chip, { backgroundColor: `${p.primary}0F` }]}>
      <Ionicons name="mail-outline" size={16} color={p.primary} />
      <Text style={[styles.chipText, { color: p.text }]} numberOfLines={1}>
        {email}
      </Text>
      <Pressable onPress={onChangeEmail} hitSlop={8}>
        <Text style={[styles.chipLink, { color: p.primary }]}>Изменить</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  chipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  chipLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
