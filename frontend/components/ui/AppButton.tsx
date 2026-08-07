import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'light';
  style?: ViewStyle;
  disabled?: boolean;
};

export function AppButton({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
  disabled,
}: Props) {
  const p = useThemePalette();

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.wrap,
          style,
          (pressed || disabled) && { opacity: 0.85 },
        ]}>
        <LinearGradient
          colors={[...p.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'light') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.lightButton,
          style,
          (pressed || disabled) && { opacity: 0.85 },
        ]}>
        {loading ? (
          <ActivityIndicator color="#333" />
        ) : (
          <Text style={styles.lightButtonText}>{title}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.ghost,
        {
          borderColor: variant === 'danger' ? p.danger : p.border,
          backgroundColor: p.card,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.primary} />
      ) : (
        <Text
          style={[
            styles.ghostText,
            { color: variant === 'danger' ? p.danger : p.text },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
  gradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lightButton: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
  },
  lightButtonText: { color: '#333333', fontSize: 16, fontWeight: '700' },
  ghost: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  ghostText: { fontSize: 16, fontWeight: '600' },
});
