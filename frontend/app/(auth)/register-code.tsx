import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthInput } from '@/components/auth/AuthInput';
import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { sendEmailCode, verifyRegistrationCode } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';
import { useThemePalette } from '@/hooks/use-theme-palette';

const PASSWORD_MIN_LENGTH = 6;

type PasswordStatus = 'idle' | 'valid' | 'invalid';

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
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>('idle');
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState<PasswordStatus>('idle');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [codeVerified, setCodeVerified] = useState(false);
  const verifyRequestId = useRef(0);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('./register');
    }
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const onResendCode = async () => {
    setError('');
    setCodeStatus('idle');
    setCodeVerified(false);
    setResending(true);
    try {
      await sendEmailCode(email, 'register');
    } catch (e) {
      setError(getApiError(e, 'Не удалось отправить код'));
    } finally {
      setResending(false);
    }
  };

  // Live password validation: обновляем иконки и рамки полей сразу при вводе.
  // idle  — пустое поле (нейтральный серый цвет);
  // valid — пароль ≥ 6 символов и пароли совпадают (зелёный);
  // invalid — пароль слишком короткий или пароли не совпадают (красный).
  const syncPasswordStatuses = useCallback((pass: string, confirm: string) => {
    if (!pass) {
      setPasswordStatus('idle');
    } else if (pass.length < PASSWORD_MIN_LENGTH || (confirm.length > 0 && confirm !== pass)) {
      setPasswordStatus('invalid');
    } else {
      setPasswordStatus('valid');
    }

    if (!confirm) {
      setConfirmPasswordStatus('idle');
    } else if (confirm !== pass || pass.length < PASSWORD_MIN_LENGTH) {
      setConfirmPasswordStatus('invalid');
    } else {
      setConfirmPasswordStatus('valid');
    }
  }, []);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setError('');
    syncPasswordStatuses(text, confirmPassword);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setError('');
    syncPasswordStatuses(password, text);
  };

  // Instant validation: отправляем код на проверку сразу после ввода 6 цифр,
  // без нажатия каких-либо кнопок.
  const handleCodeChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, 6);
      setCode(digits);
      setError('');
      if (!email) return;

      const requestId = ++verifyRequestId.current;

      if (digits.length === 6) {
        setCodeStatus('loading');
        setCodeVerified(false);
        verifyRegistrationCode(email, digits)
          .then(() => {
            if (verifyRequestId.current !== requestId) return;
            setCodeStatus('success');
            setCodeVerified(true);
          })
          .catch((err) => {
            if (verifyRequestId.current !== requestId) return;
            setCodeStatus('error');
            setCodeVerified(false);
            setError(getApiError(err, 'Проверьте код и попробуйте ещё раз.'));
          });
      } else {
        // Меньше 6 цифр — сбрасываем статус и отменяем «висящий» запрос.
        setCodeStatus('idle');
        setCodeVerified(false);
      }
    },
    [email],
  );

  const onRegister = async () => {
    setError('');
    syncPasswordStatuses(password, confirmPassword);
    if (!codeVerified || code.trim().length !== 6) {
      setError('Сначала введите и подтвердите код из письма');
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
    <Screen scroll style={styles.container} glow={false}>
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
        <View style={styles.fieldRow}>
          {codeStatus === 'loading' ? (
            <ActivityIndicator size="small" color="#10b981" style={styles.fieldIcon} />
          ) : (
            <Ionicons
              name={codeStatus === 'success' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={codeStatus === 'success' ? '#10b981' : '#94a3b8'}
              style={styles.fieldIcon}
            />
          )}
          <AuthInput
            placeholder="Код из письма"
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            noBorder
            style={styles.inputWithIcon}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Ionicons name="person-outline" size={20} color="#999999" style={styles.fieldIcon} />
          <AuthInput
            placeholder="Имя пользователя"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            noBorder
            style={styles.inputWithIcon}
          />
        </View>

        <View style={styles.divider} />

        <View
          style={[
            styles.fieldRow,
            passwordStatus === 'valid' && styles.fieldValid,
            passwordStatus === 'invalid' && styles.fieldInvalid,
          ]}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#999999" style={styles.fieldIcon} />
          <AuthInput
            placeholder="Пароль"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoComplete="new-password"
            noBorder
            style={styles.inputWithIcon}
          />
          <Ionicons
            name={
              passwordStatus === 'valid'
                ? 'checkmark-circle'
                : passwordStatus === 'invalid'
                  ? 'close-circle'
                  : 'lock-closed-outline'
            }
            size={20}
            color={
              passwordStatus === 'valid'
                ? '#10b981'
                : passwordStatus === 'invalid'
                  ? '#ef4444'
                  : '#999999'
            }
            style={styles.statusIcon}
          />
        </View>

        <View style={styles.divider} />

        <View
          style={[
            styles.fieldRow,
            confirmPasswordStatus === 'valid' && styles.fieldValid,
            confirmPasswordStatus === 'invalid' && styles.fieldInvalid,
          ]}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#999999" style={styles.fieldIcon} />
          <AuthInput
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry
            autoComplete="new-password"
            noBorder
            style={styles.inputWithIcon}
          />
          <Ionicons
            name={
              confirmPasswordStatus === 'valid'
                ? 'checkmark-circle'
                : confirmPasswordStatus === 'invalid'
                  ? 'close-circle'
                  : 'lock-closed-outline'
            }
            size={20}
            color={
              confirmPasswordStatus === 'valid'
                ? '#10b981'
                : confirmPasswordStatus === 'invalid'
                  ? '#ef4444'
                  : '#999999'
            }
            style={styles.statusIcon}
          />
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: p.danger }]}>{error}</Text> : null}

      <AppButton
        title={loading ? 'Создание аккаунта…' : 'Создать аккаунт'}
        onPress={onRegister}
        loading={loading}
        disabled={!codeVerified}
        variant="primary"
        gradientColors={['#7C8CF8', '#A78BFA', '#F472B6']}
        buttonRadius={12}
        style={styles.mainButton}
      />

      <Pressable
        onPress={onResendCode}
        disabled={resending}
        style={styles.secondaryButton}
      >
        {resending ? (
          <ActivityIndicator color={p.primary} />
        ) : (
          <Text style={[styles.secondaryButtonText, { color: p.textMuted }]}>
            Отправить код снова
          </Text>
        )}
      </Pressable>
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
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    paddingVertical: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 16,
  },
  fieldIcon: {
    width: 24,
    marginRight: 12,
    textAlign: 'center',
    color: '#999999',
  },
  successIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222222',
    backgroundColor: 'transparent',
  },
  fieldValid: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  fieldInvalid: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  statusIcon: {
    width: 24,
    marginLeft: 4,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#94a3b8',
    marginLeft: 52,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  mainButton: {
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  secondaryButton: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});