import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
};

export function Screen({
  children,
  scroll,
  padded = true,
  style,
  refreshControl,
  ...rest
}: Props) {
  const p = useThemePalette();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        padded && { paddingHorizontal: 20, paddingBottom: 24 },
        { paddingTop: insets.top + 12 },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <LinearGradient
        colors={[`${p.primary}22`, 'transparent']}
        style={styles.glow}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            contentContainerStyle={styles.flexGrow}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
});
