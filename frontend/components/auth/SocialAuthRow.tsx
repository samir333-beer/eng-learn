import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';

const providers = [
  { id: 'google', icon: 'logo-google' as const, label: 'Google', color: '#EA4335' },
  { id: 'apple', icon: 'logo-apple' as const, label: 'Apple', color: '#000' },
];

export function SocialAuthRow() {
  const p = useThemePalette();

  const onPress = (label: string) => {
    // Placeholder for social auth implementation
    console.log(`${label} auth coming soon`);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: p.border }]} />
        <Text style={[styles.dividerText, { color: p.textMuted }]}>или войти через</Text>
        <View style={[styles.line, { backgroundColor: p.border }]} />
      </View>
      <View style={styles.buttons}>
        {providers.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item.label)}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: item.color },
              pressed && { opacity: 0.8 },
            ]}>
            <Ionicons name={item.icon} size={24} color="#fff" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 28, gap: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '500' },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
