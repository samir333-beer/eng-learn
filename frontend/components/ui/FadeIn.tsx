import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

type Props = PropsWithChildren<{
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}>;

export function FadeIn({ children, delay = 0, duration = 400, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, duration, delay]);

  return (
    <Animated.View
      collapsable={false}
      style={[styles.base, { opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { width: '100%' },
});
