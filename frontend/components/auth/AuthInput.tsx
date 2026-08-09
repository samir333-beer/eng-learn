import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = TextInputProps & {
  noBorder?: boolean;
};

export function AuthInput({ noBorder, style, ...props }: Props) {
  const p = useThemePalette();
  return (
    <TextInput
      placeholderTextColor="#9AA4B8"
      selectionColor="#60A5FA"
      autoCapitalize="none"
      {...props}
      style={[
        styles.input,
        {
          backgroundColor: p.card,
          borderColor: p.border,
          color: p.text,
          ...(noBorder && styles.noBorder),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  noBorder: {
    borderWidth: 0,
  },
});