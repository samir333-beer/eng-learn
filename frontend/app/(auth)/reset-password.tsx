import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemePalette } from '@/hooks/use-theme-palette';
import { useResetPassword } from '@/hooks/useResetPassword';
import { SocialIcon } from '@/components/ui/SocialIcon';

import { styles } from '../../styles/reset-password.styles';

export default function ResetPasswordScreen() {
  const p = useThemePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    step,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    showPassword,
    setShowPassword,
    emailError,
    setEmailError,
    sendingCode,
    codeError,
    setCodeError,
    passwordError,
    setPasswordError,
    resetting,
    resendIn,
    resending,
    isResetValid,
    canResend,
    sendCode,
    resendCode,
    resetPassword,
    goBackToEmail,
  } = useResetPassword();

  // Stepwise back navigation:
  // - On step 'email' (screen 2): router.back() returns to login (screen 1).
  // - On step 'reset' (screen 3): goBackToEmail() returns to step 'email' (screen 2),
  //   never skipping a step. The system back gesture/button on Android is handled
  //   by the same logic via the onPress handler below.
  const handleBack = () => {
    if (step === 'reset') {
      goBackToEmail();
    } else {
      router.back();
    }
  };

  // Intercept the Android system back button/gesture so that from step 'reset'
  // (screen 3) it returns to step 'email' (screen 2) instead of skipping
  // straight to login (screen 1). The flow stays strictly stepwise.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'reset') {
        goBackToEmail();
        return true; // prevent default back navigation (would skip to login)
      }
      return false; // allow default back navigation (screen 2 → login)
    });
    return () => subscription.remove();
  }, [step, goBackToEmail]);

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
            {/* Back button — visually identical to the one on the register screen */}
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={12}>
              <Ionicons name="chevron-back" size={28} color={p.text} />
            </Pressable>

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
                        onPress={resendCode}
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
                onPress={sendCode}
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
                onPress={resetPassword}
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
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderWidth: 1.5,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {}}>
                <SocialIcon provider="google" size={24} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderWidth: 1.5,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {}}>
                <SocialIcon provider="apple" size={24} color="#000000" />
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