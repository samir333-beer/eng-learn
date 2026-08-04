import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = TextInputProps & {
  label: string;
};

export function AuthField({ label, style, ...props }: Props) {
  const p = useThemePalette();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: p.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={p.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: p.card,
            borderColor: p.border,
            color: p.text,
          },
          style,
        ]}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: '500',
  },
});
