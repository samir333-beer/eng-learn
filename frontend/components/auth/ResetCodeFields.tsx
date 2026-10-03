import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { OtpInput, type OtpStatus } from '@/components/auth/OtpInput';
import { ResendRow } from '@/components/auth/ResendRow';
import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  code: string;
  onChangeCode: (code: string) => void;
  /** Живой статус кода: loading/valid/invalid — как в регистрации. */
  codeStatus: OtpStatus;
  codeError: string;
  newPassword: string;
  onChangeNewPassword: (password: string) => void;
  passwordError: string;
  canResend: boolean;
  resendIn: number;
  resending: boolean;
  onResend: () => void;
  resetting: boolean;
};

/** Шаг 2 сброса пароля: OTP-код + новый пароль + повторная отправка кода. */
export const ResetCodeFields = memo(function ResetCodeFields({
  code,
  onChangeCode,
  codeStatus,
  codeError,
  newPassword,
  onChangeNewPassword,
  passwordError,
  canResend,
  resendIn,
  resending,
  onResend,
  resetting,
}: Props) {
  const p = useThemePalette();

  return (
    <>
      {/* Сегментированный OTP-ввод: ячейки краснеют при неверном коде
          и зеленеют при верном — живая проверка, как в регистрации */}
      <View style={styles.otpBlock}>
        <Text style={[styles.otpLabel, { color: p.textMuted }]}>
          Код подтверждения
        </Text>
        <OtpInput
          value={code}
          onChangeText={onChangeCode}
          status={codeStatus}
          editable={!resetting}
        />
        {codeError ? (
          <Text style={[styles.otpError, { color: p.danger }]}>{codeError}</Text>
        ) : null}
      </View>

      <AuthField
        label="Новый пароль"
        icon="lock-closed-outline"
        placeholder="Минимум 8 символов"
        value={newPassword}
        onChangeText={onChangeNewPassword}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!resetting}
        error={passwordError || undefined}
      />

      <ResendRow
        resendIn={canResend ? 0 : resendIn}
        resending={resending}
        onResend={onResend}
        resendLabel="Отправить повторно"
      />
    </>
  );
});

const styles = StyleSheet.create({
  otpBlock: {
    gap: 10,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  otpError: {
    fontSize: 13,
    textAlign: 'center',
  },
});
