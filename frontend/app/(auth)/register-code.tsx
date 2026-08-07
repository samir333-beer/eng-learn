import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthInput } from '@/components/auth/AuthInput';
import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { sendEmailCode } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

export default function RegisterCodeScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const p = useThemePalette();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // The back button and the system back gesture/button both call router.back(),
  // which returns to the previous step (email screen) in the navigation stack.
  // If there's no back history (e.g. deep link), fall back to the email step.
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('./register');
    }
  };

  // Intercept the Android system back button/gesture so it behaves identically
  // to the UI back button — always router.back() to the previous step.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true; // prevent default back navigation (would exit the app)
    });
    return () => subscription.remove();
  }, []);

  const onResendCode = async () => {
    setError('');
    setResending(true);
    try {
      await sendEmailCode(email, 'register');
    } catch (e) {
      setError(getApiError(e, 'Не удалось отправить код'));
    } finally {
      setResending(false);
    }
  };

  const onRegister = async () => {
    setError('');
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
    if (confirmPassword !== password) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, code.trim(), username.trim(), password);
    } catch (e) {
      setError(getApiError(e, 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.container}>
      <Pressable 
        onPress={handleBack}
        style={styles.backButton}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={28} color={p.text} />
      </Pressable>

      <View style={styles.header}>
        <Text style={[styles.title, { color: p.text }]}>Создать аккаунт</Text>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>
          Введите код из письма и завершите регистрацию
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputWrapper}>
          <Ionicons 
            name="checkmark-done" 
            size={20} 
            color="#999999" 
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

        <View style={styles.divider} />

        <View style={styles.inputWrapper}>
          <Ionicons 
            name="person-outline" 
            size={20} 
            color="#999999" 
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

        <View style={styles.divider} />

        <View style={styles.inputWrapper}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color="#999999" 
            style={styles.inputIcon} 
          />
          <AuthInput
            placeholder="Пароль"
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
              color="#999999" 
            />
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.inputWrapper}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color="#999999" 
            style={styles.inputIcon} 
          />
          <AuthInput
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoComplete="new-password"
            style={styles.inputWithIcon}
          />
          <Pressable 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color="#999999" 
            />
          </Pressable>
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: p.danger }]}>{error}</Text> : null}

      <AppButton
        title={loading ? 'Создание аккаунта…' : 'Создать аккаунт'}
        onPress={onRegister}
        loading={loading}
        variant="light"
        style={styles.mainButton}
      />

      <AppButton
        title="Отправить код снова"
        variant="ghost"
        onPress={onResendCode}
        loading={resending}
        style={styles.secondaryButton}
      />
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEEEEE',
    marginLeft: 52,
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
});