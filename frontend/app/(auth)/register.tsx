import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthInput } from '@/components/auth/AuthInput';
import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { sendEmailCode } from '@/lib/api/auth';
import { useAuth } from '@/context/AuthContext';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

const socialProviders = [
  { id: 'google', icon: 'logo-google' as const, label: 'Google', color: '#EA4335' },
  { id: 'apple', icon: 'logo-apple' as const, label: 'Apple', color: '#000' },
  { id: 'telegram', icon: 'paper-plane' as const, label: 'Telegram', color: '#0088cc' },
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const p = useThemePalette();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSendCode = async () => {
    setError('');
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    setLoading(true);
    try {
      await sendEmailCode(email.trim(), 'register');
      setCodeSent(true);
    } catch (e) {
      setError(getApiError(e, 'Не удалось отправить код'));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    setError('');
    if (!codeSent) {
      await onSendCode();
      return;
    }
    if (code.trim().length < 6) {
      setError('Введите 6-значный код из письма');
      return;
    }
    if (username.trim().length < 3) {
      setError('Имя — минимум 3 символа');
      return;
    }
    if (password.length < 6) {
      setError('Пароль — минимум 6 символов');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), code.trim(), username.trim(), password);
    } catch (e) {
      setError(getApiError(e, 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && codeSent === undefined) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={p.primary} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.container}>
      <Pressable 
        onPress={() => router.replace('/(auth)/login')}
        style={styles.backButton}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={28} color={p.text} />
      </Pressable>

      <View style={styles.header}>
        <Text style={[styles.title, { color: p.text }]}>Создать аккаунт</Text>
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
            editable={!codeSent}
            style={styles.inputWithIcon}
          />
        </View>

        {codeSent ? (
          <>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="checkmark-done" 
                size={20} 
                color={p.textMuted} 
                style={styles.inputIcon} 
              />
              <AuthInput
                placeholder="Код из письма"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.inputWithIcon}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={p.textMuted} 
                style={styles.inputIcon} 
              />
              <AuthInput
                placeholder="Имя пользователя"
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
                style={styles.inputWithIcon}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={p.textMuted} 
                style={styles.inputIcon} 
              />
              <AuthInput
                placeholder="Пароль (минимум 6 символов)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={styles.inputWithIcon}
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={p.textMuted} 
                />
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      {error ? <Text style={[styles.error, { color: p.danger }]}>{error}</Text> : null}

      <AppButton
        title={
          codeSent ? 
            (loading ? 'Создание аккаунта…' : 'Создать аккаунт') : 
            (loading ? 'Отправка кода…' : 'Отправить код')
        }
        onPress={codeSent ? onRegister : onSendCode}
        loading={loading}
        style={styles.mainButton}
      />

      {codeSent ? (
        <AppButton
          title="Отправить код снова"
          variant="ghost"
          onPress={onSendCode}
          loading={loading}
          style={styles.secondaryButton}
        />
      ) : null}

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
        <Text style={[styles.dividerText, { color: p.textMuted }]}>
          или зарегистрироваться через
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
      </View>

      <View style={styles.socialButtons}>
        {socialProviders.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.socialButton,
              { backgroundColor: item.color },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {}}>
            <Ionicons name={item.icon} size={24} color="#fff" />
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: p.textMuted }]}>
          Уже есть аккаунт?{' '}
        </Text>
        <Link href="/(auth)/login" style={[styles.link, { color: p.primary }]}>
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
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  mainButton: {
    marginBottom: 12,
  },
  secondaryButton: {
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
    fontWeight: '700',
  },
});
