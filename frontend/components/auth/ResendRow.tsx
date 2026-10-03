import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  /** Секунд до возможности повторной отправки; 0 — можно отправлять. */
  resendIn: number;
  resending: boolean;
  onResend: () => void;
  /** Текст ссылки (у экранов он чуть различается). */
  resendLabel?: string;
};

/** Строка «Не пришёл код? …» с таймером или ссылкой повторной отправки. */
export function ResendRow({
  resendIn,
  resending,
  onResend,
  resendLabel = 'Отправить снова',
}: Props) {
  const p = useThemePalette();

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: p.textMuted }]}>Не пришёл код? </Text>
      {resendIn > 0 ? (
        <Text style={[styles.timer, { color: p.textMuted }]}>
          Повторно через {resendIn} с
        </Text>
      ) : (
        <Pressable onPress={onResend} disabled={resending} hitSlop={8}>
          {resending ? (
            <ActivityIndicator size="small" color={p.primary} />
          ) : (
            <Text style={[styles.link, { color: p.primary }]}>{resendLabel}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  text: {
    fontSize: 14,
  },
  timer: {
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
});
