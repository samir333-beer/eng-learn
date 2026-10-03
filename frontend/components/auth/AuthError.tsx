import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';

/** Единый баннер ошибки для экранов авторизации. */
export function AuthError({ message }: { message: string }) {
  const p = useThemePalette();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: `${p.danger}0D`, borderColor: `${p.danger}2E` },
      ]}>
      <Ionicons name="warning" size={18} color={p.danger} />
      <Text style={[styles.text, { color: p.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
