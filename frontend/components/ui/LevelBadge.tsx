import { StyleSheet, Text, View } from 'react-native';

import { LevelColors } from '@/constants/design';

export function LevelBadge({ level }: { level: string }) {
  const color = LevelColors[level] ?? '#64748B';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
});
