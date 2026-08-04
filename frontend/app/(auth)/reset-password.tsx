import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemePalette } from '@/hooks/use-theme-palette';
import { forgotPassword, resetPassword } from '@/lib/api/auth';
import { getApiError } from '@/lib/errors';

const RESEND_SECONDS = 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'reset';

export default function ResetPasswordScreen() {
  const p = useThemePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 state
  const [emailError, setEmailError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  // Step 2 state
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetting, setResetting] = useState(false);

  // Resend timer
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 'reset') return;
    setResendIn(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const validateEmail = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Введите email';
    if (!EMAIL_REGEX.test(trimmed)) return 'Введите корректный email';
    return '';
  };

  const handleSendCode = async () => {
    setEmailError('');
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setSendingCode(true);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (e) {
      setEmailError(getApiError(e, 'Не удалось отправить код'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendIn > 0 || resending) return;
    setEmailError('');
    setResending(true);
    try {
      await forgotPassword(email.trim());
      setResendIn(RESEND_SECONDS);
      timerRef.current = setInterval(() => {
        setResendIn((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert('Ошибка', getApiError(e, 'Не удалось отправить код повторно'));
    } finally {
      setResending(false);
    }
  };

  const isResetValid =
    /^\d{6}$/.test(code.trim()) && newPassword.length >= 8;

  const handleResetPassword = async () => {
    setCodeError('');
    setPasswordError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('Введите 6-значный код из письма');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Пароль должен быть не короче 8 символов');
      return;
    }

    setResetting(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert('Пароль изменён', 'Теперь вы можете войти с новым паролем.', [
        { text: 'ОК', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const message = getApiError(e, 'Не удалось сбросить пароль');
      if (status === 400) {
        setCodeError(message);
      } else if (status === 422) {
        setPasswordError(message);
      } else {
        Alert.alert('Ошибка', message);
      }
    } finally {
      setResetting(false);
    }
  };

  const canResend = resendIn === 0 && !resending;

  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <LinearGradient
        colors={[`${p.primary}18`, 'transparent']}
        style={styles.glow}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconBadge}>
                <Ionicons name="key-outline" size={28} color={p.primary} />
              </View>
              <Text style={[styles.title, { color: p.text }]}>Сброс пароля</Text>
              <Text style={[styles.subtitle, { color: p.textMuted }]}>
                {step === 'email'
                  ? 'Введите email для восстановления'
                  : 'Введите код из письма и новый пароль'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Step 1: Email */}
              {step === 'email' ? (
                <View style={styles.field}>
                  <Text style={[styles.label, { color: p.textMuted }]}>Email</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      { borderColor: emailError ? p.danger : p.border },
                    ]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={p.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="you@example.com"
                      placeholderTextColor="#9AA4B8"
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        if (emailError) setEmailError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!sendingCode}
                      style={[styles.input, { color: p.text }]}
                    />
                  </View>
                  {emailError ? (
                    <Text style={[styles.fieldError, { color: p.danger }]}>
                      {emailError}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* Step 2: Code + New password */}
              {step === 'reset' ? (
                <>
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: p.textMuted }]}>
                      Код подтверждения
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { borderColor: codeError ? p.danger : p.border },
                      ]}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color={p.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="6-значный код"
                        placeholderTextColor="#9AA4B8"
                        value={code}
                        onChangeText={(v) => {
                          setCode(v.replace(/[^0-9]/g, ''));
                          if (codeError) setCodeError('');
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!resetting}
                        style={[styles.input, { color: p.text }]}
                      />
                    </View>
                    {codeError ? (
                      <Text style={[styles.fieldError, { color: p.danger }]}>
                        {codeError}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.label, { color: p.textMuted }]}>
                      Новый пароль
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { borderColor: passwordError ? p.danger : p.border },
                      ]}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={p.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="Минимум 8 символов"
                        placeholderTextColor="#9AA4B8"
                        value={newPassword}
                        onChangeText={(v) => {
                          setNewPassword(v);
                          if (passwordError) setPasswordError('');
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!resetting}
                        style={[styles.input, { color: p.text }]}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        hitSlop={8}>
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={p.textMuted}
                        />
                      </Pressable>
                    </View>
                    {passwordError ? (
                      <Text style={[styles.fieldError, { color: p.danger }]}>
                        {passwordError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Resend code */}
                  <View style={styles.resendRow}>
                    <Text style={[styles.resendText, { color: p.textMuted }]}>
                      Не пришёл код?{' '}
                    </Text>
                    {canResend ? (
                      <Pressable
                        onPress={handleResendCode}
                        disabled={resending}
                        hitSlop={8}>
                        {resending ? (
                          <ActivityIndicator size="small" color={p.primary} />
                        ) : (
                          <Text style={[styles.resendLink, { color: p.primary }]}>
                            Отправить повторно
                          </Text>
                        )}
                      </Pressable>
                    ) : (
                      <Text style={[styles.resendTimer, { color: p.textMuted }]}>
                        Отправить повторно через {resendIn} сек
                      </Text>
                    )}
                  </View>
                </>
              ) : null}
            </View>

            {/* Submit button */}
            {step === 'email' ? (
              <Pressable
                onPress={handleSendCode}
                disabled={sendingCode}
                style={({ pressed }) => [
                  styles.submitWrap,
                  (pressed || sendingCode) && { opacity: 0.85 },
                ]}>
                <LinearGradient
                  colors={[...p.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}>
                  {sendingCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Отправить код</Text>
                  )}
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleResetPassword}
                disabled={!isResetValid || resetting}
                style={({ pressed }) => [
                  styles.submitWrap,
                  (!isResetValid || resetting) && styles.submitDisabled,
                  pressed && !resetting && isResetValid && { opacity: 0.85 },
                ]}>
                <LinearGradient
                  colors={[...p.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}>
                  {resetting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Сбросить пароль</Text>
                  )}
                </LinearGradient>
              </Pressable>
            )}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
              <Text style={[styles.dividerText, { color: p.textMuted }]}>
                или войти через
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: p.border }]} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.socialButton,
                  { backgroundColor: '#EA4335' },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => {}}>
                <Ionicons name="logo-google" size={22} color="#fff" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.socialButton,
                  { backgroundColor: '#000' },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => {}}>
                <Ionicons name="logo-apple" size={22} color="#fff" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.socialButton,
                  { backgroundColor: '#0088cc' },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => {}}>
                <Ionicons name="paper-plane" size={22} color="#fff" />
              </Pressable>
            </View>

            {/* Back to login */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: p.textMuted }]}>
                Вспомнили пароль?{' '}
              </Text>
              <Link href="/(auth)/login" style={[styles.loginLink, { color: p.primary }]}>
                Войти
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F0F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    gap: 20,
    marginBottom: 28,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: '#F2F3F5',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fieldError: {
    fontSize: 13,
    marginLeft: 4,
    lineHeight: 18,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  resendTimer: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
  },
});