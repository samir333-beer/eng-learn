import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthInput } from '@/components/auth/AuthInput';
import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { sendEmailCode } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

const socialProviders = [
  { id: 'google', icon: 'logo-google' as const, label: 'Google', color: '#EA4335' },
  { id: 'apple', icon: 'logo-apple' as const, label: 'Apple', color: '#1A1A1A' },
  { id: 'telegram', icon: 'paper-plane' as const, label: 'Telegram', color: '#0088cc' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const p = useThemePalette();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSendCode = async () => {
    setError('');
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    setLoading(true);
    try {
      await sendEmailCode(email.trim(), 'register');
      // Push the next step onto the navigation stack so that
      // the system back gesture / UI back button can return here.
      router.push(`./register-code?email=${encodeURIComponent(email.trim())}`);
    } catch (e) {
      setError(getApiError(e, 'Не удалось отправить код'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.container}>
      <Pressable 
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={28} color={p.text} />
      </Pressable>

      <View style={styles.header}>
        <Text style={[styles.title, { color: p.text }]}>Начать обучение</Text>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>
          Зарегистрируйтесь и начните учить английский
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={p.textMuted} 
            style={styles.inputIcon} 
          />
          <AuthInput
            placeholder="Email адрес"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            style={styles.inputWithIcon}
          />
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: p.danger }]}>{error}</Text> : null}

      <AppButton
        title={loading ? 'Отправка кода…' : 'Отправить код'}
        onPress={onSendCode}
        loading={loading}
        style={styles.mainButton}
      />

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
        <Text style={[styles.dividerText, { color: p.textMuted }]}>
          или зарегистрируйтесь через
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
      </View>

      <View style={styles.socialButtons}>
        {socialProviders.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.socialButton,
              { backgroundColor: p.card, borderColor: p.border },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {}}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: p.textMuted }]}>
          Уже есть аккаунт?{' '}
        </Text>
        <Link href="/(auth)/login" style={[styles.link, { color: p.textMuted }]}>
          Войти
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    minWidth: 48,
    minHeight: 48,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 20,
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  mainButton: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
});