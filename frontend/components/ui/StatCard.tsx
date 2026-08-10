import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  label: string;
  value: string | number;
  accent?: string;
  icon?: string;
  highlight?: boolean;
};

export function StatCard({ label, value, accent, icon, highlight }: Props) {
  const p = useThemePalette();

  if (highlight) {
    return (
      <LinearGradient
        colors={p.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.value, styles.valueOnGradient]}>{value}</Text>
        <Text style={[styles.label, styles.labelOnGradient]}>{label}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border, borderWidth: 1 }]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
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
    gap: 4,
  },
  icon: { fontSize: 20, marginBottom: 2 },
  value: { fontSize: 26, fontWeight: '800' },
  valueOnGradient: { color: '#fff' },
  label: { fontSize: 13 },
  labelOnGradient: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});
