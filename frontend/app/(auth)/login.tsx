import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthInput } from '@/components/auth/AuthInput';
import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

export default function LoginScreen() {
  const { signInPassword, isLoading: authLoading } = useAuth();
  const p = useThemePalette();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInPassword(email.trim(), password);
    } catch (e) {
      setError(getApiError(e, 'Ошибка входа'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={p.primary} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: p.text }]}>Рады видеть снова! 👋</Text>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>
          Войдите в свой аккаунт, чтобы продолжить
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

        <View style={styles.inputWrapper}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color={p.textMuted} 
            style={styles.inputIcon} 
          />
          <AuthInput
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
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

        <View style={styles.rememberRow}>
          <Pressable 
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.checkboxRow}
          >
            <View style={[
              styles.checkbox, 
              { borderColor: p.border },
              rememberMe && { backgroundColor: p.primary, borderColor: p.primary }
            ]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={[styles.rememberText, { color: p.text }]}>
              Запомнить меня
            </Text>
          </Pressable>

          <Link href="/(auth)/reset-password" style={[styles.forgotText, { color: p.primary }]}>
            Забыли пароль?
          </Link>
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: p.danger }]}>{error}</Text> : null}

      <AppButton
        title={submitting ? 'Вход…' : 'Войти'}
        onPress={onSubmit}
        loading={submitting}
        style={styles.loginButton}
      />

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
        <Text style={[styles.dividerText, { color: p.textMuted }]}>
          или войти через
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
      </View>

      <View style={styles.socialButtons}>
        <Pressable 
          style={[styles.socialButton, { backgroundColor: '#EA4335' }]}
          onPress={() => {}}
        >
          <Ionicons name="logo-google" size={24} color="#fff" />
        </Pressable>
        <Pressable 
          style={[styles.socialButton, { backgroundColor: '#000' }]}
          onPress={() => {}}
        >
          <Ionicons name="logo-apple" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: p.textMuted }]}>
          Еще нет аккаунта?{' '}
        </Text>
        <Link href="/(auth)/register" style={[styles.signupLink, { color: p.primary }]}>
          Зарегистрироваться
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  header: {
    marginBottom: 40,
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
  },
});
