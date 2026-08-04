import { StyleSheet, Text, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  label: string;
  value: string | number;
  accent?: string;
};

export function StatCard({ label, value, accent }: Props) {
  const p = useThemePalette();
  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={[styles.value, accent ? { color: accent } : { color: p.primary }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: p.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  value: { fontSize: 26, fontWeight: '800' },
  label: { fontSize: 13 },
});
