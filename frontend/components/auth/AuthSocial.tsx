import { StyleSheet, Text, View } from 'react-native';

import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  onSuccess: (idToken: string) => void | Promise<void>;
  loading?: boolean;
  dividerText?: string;
};

/** Разделитель «или» + кнопка входа через Google. */
export function AuthSocial({
  onSuccess,
  loading,
  dividerText = 'или продолжите через',
}: Props) {
  const p = useThemePalette();

  return (
    <View>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: p.border }]} />
        <Text style={[styles.dividerText, { color: p.textMuted }]}>
          {dividerText}
        </Text>
        <View style={[styles.line, { backgroundColor: p.border }]} />
      </View>

      <GoogleSignInButton onSuccess={onSuccess} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
