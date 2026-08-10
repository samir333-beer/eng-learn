import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useThemePalette } from '@/hooks/use-theme-palette';

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  label: string;
  value: string;
};

export function ProgressRing({
  size = 140,
  strokeWidth = 12,
  progress,
  label,
  value,
}: Props) {
  const p = useThemePalette();
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={p.gradient[0]} />
            <Stop offset="0.5" stopColor={p.gradient[1]} />
            <Stop offset="1" stopColor={p.gradient[2]} />
          </LinearGradient>
        </Defs>
        {/* Подложка */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={p.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Дуга прогресса */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: p.text }]}>{value}</Text>
        <Text style={[styles.label, { color: p.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  value: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 12 },
});
