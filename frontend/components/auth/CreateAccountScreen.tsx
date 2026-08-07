import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

type FieldErrors = {
  code?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
};

type FieldRowProps = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function FieldRow({
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  onToggleSecure,
  keyboardType,
  maxLength,
  autoCapitalize,
}: FieldRowProps) {
  return (
    <View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#AAAAAA"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
        />
        {onToggleSecure ? (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onToggleSecure}
            hitSlop={8}
          >
            <Text style={styles.eyeIcon}>{secureTextEntry ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function CreateAccountScreen() {
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [seconds, setSeconds] = useState(30);

  // Тикающий таймер: обратный отсчёт с 30 до 0 секунд.
  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleBack = () => {
    // Здесь подключите навигацию по месту, например router.back().
  };

  const handleResend = () => {
    if (seconds > 0) {
      return;
    }
    // Повторная отправка кода: сбрасываем таймер заново на 30 секунд.
    setSeconds(30);
  };

  const clearError = (field: keyof FieldErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = () => {
    const newErrors: FieldErrors = {};

    // Код: ровно 6 цифр.
    if (!/^\d{6}$/.test(code.trim())) {
      newErrors.code = 'Код должен состоять из 6 цифр';
    }

    // Имя пользователя: не короче 3 символов.
    if (username.trim().length < 3) {
      newErrors.username = 'Имя должно быть не короче 3 символов';
    }

    // Пароль: не менее 6 символов.
    if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    // Подтверждение пароля: строгое совпадение с первым паролем.
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).length > 0;
    if (!hasErrors) {
      Alert.alert('Успешная регистрация!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.safeArea}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Шапка: стрелка назад */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={12}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>

        {/* Блок заголовка */}
        <View style={styles.header}>
          <Text style={styles.title}>Создать аккаунт</Text>
          <Text style={styles.subtitle}>
            Введите код из письма и завершите регистрацию
          </Text>
        </View>

        {/* Центральный блок полей ввода (Card Style) */}
        <View style={styles.card}>
          <FieldRow
            icon="✓"
            placeholder="Код из письма"
            value={code}
            onChangeText={(text) => {
              setCode(text);
              clearError('code');
            }}
            error={errors.code}
            keyboardType="numeric"
            maxLength={6}
          />

          <View style={styles.divider} />

          <FieldRow
            icon="👤"
            placeholder="Имя пользователя"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              clearError('username');
            }}
            error={errors.username}
            autoCapitalize="none"
          />

          <View style={styles.divider} />

          <FieldRow
            icon="🔒"
            placeholder="Пароль"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError('password');
              clearError('confirmPassword');
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((prev) => !prev)}
          />

          <View style={styles.divider} />

          <FieldRow
            icon="🔒"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            error={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword((prev) => !prev)}
          />
        </View>

        {/* Блок повторной отправки кода (под карточкой, перед кнопкой) */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Не пришёл код? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={seconds > 0}
            hitSlop={8}
          >
            <Text
              style={[
                styles.resendLink,
                seconds > 0 ? styles.resendLinkDisabled : null,
              ]}
            >
              Отправить повторно
            </Text>
          </TouchableOpacity>
          {seconds > 0 ? (
            <Text style={styles.resendText}> через {seconds} сек</Text>
          ) : null}
        </View>

        {/* Основная кнопка */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Создать аккаунт</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 4,
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 34,
    color: '#000000',
  },
  header: {
    marginTop: 8,
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 58,
  },
  fieldIcon: {
    width: 24,
    marginRight: 12,
    fontSize: 18,
    textAlign: 'center',
    color: '#999999',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#222222',
  },
  eyeButton: {
    padding: 6,
    marginLeft: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEEEEE',
    marginLeft: 52,
  },
  fieldError: {
    paddingHorizontal: 52,
    paddingBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#E53935',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#888888',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  resendLinkDisabled: {
    color: '#BBBBBB',
    fontWeight: '400',
  },
  button: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
});