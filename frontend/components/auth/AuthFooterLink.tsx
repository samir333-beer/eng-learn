import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  text: string;
  linkText: string;
  href: Href;
};

/** Нижняя строка-ссылка: «Уже есть аккаунт? Войти». */
export function AuthFooterLink({ text, linkText, href }: Props) {
  const p = useThemePalette();

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: p.textMuted }]}>{text} </Text>
      <Link href={href} style={[styles.link, { color: p.primary }]}>
        {linkText}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  text: {
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: '700',
  },
});
