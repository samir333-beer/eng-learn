import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = TextInputProps & {
  noBorder?: boolean;
  flat?: boolean;
};

export function AuthInput({ noBorder, flat, style, ...props }: Props) {
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
          ...(flat && styles.flat),
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
  flat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderRadius: 0,
    paddingHorizontal: 0,
  },
});
