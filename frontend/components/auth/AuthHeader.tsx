import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
};

export function AuthHeader({
  title = 'English Flow',
  subtitle = 'Учите 160 фраз по уровням A1–B2',
  showBack = false,
}: Props) {
  const p = useThemePalette();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.backIcon, { color: p.text }]}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text style={[styles.title, { color: p.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: p.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 28 },
  back: { marginBottom: 12, alignSelf: 'flex-start' },
  backPlaceholder: { height: 8 },
  backIcon: { fontSize: 28, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22 },
});
