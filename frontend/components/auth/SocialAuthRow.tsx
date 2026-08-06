import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import { useThemePalette } from '@/hooks/use-theme-palette';

/**
 * Official Telegram logo glyph — the white paper-plane from the official
 * Telegram logo (telegram.org brand asset, https://telegram.org/img/t_logo.svg).
 * The blue circle behind it is the button background (#0088CC), so the plane
 * paths are rendered on top of it exactly like the official mark.
 */
const TELEGRAM_PLANE_PATHS = [
  { fill: '#FFFFFF', d: 'M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80' },
  { fill: '#EEEEEE', d: 'M98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035' },
  { fill: '#FFFFFF', d: 'M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.5 44.55c-7.89 3.17-7.844 7.567-1.438 9.53l29.663 9.279 68.673-43.325c3.242-1.965 6.218-.91 3.776 1.258' },
];

const providers = [
  { id: 'google', icon: 'logo-google' as const, label: 'Google', color: '#EA4335' },
  { id: 'apple', icon: 'logo-apple' as const, label: 'Apple', color: '#000' },
  { id: 'telegram', label: 'Telegram', color: '#0088cc' },
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
            {item.id === 'telegram' ? (
              <Svg width={24} height={24} viewBox="0 0 240 240">
                {TELEGRAM_PLANE_PATHS.map((p) => (
                  <Path key={p.fill + '.' + p.d} fill={p.fill} d={p.d} />
                ))}
              </Svg>
            ) : (
              <Ionicons name={item.icon} size={24} color="#fff" />
            )}
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
