import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  variant: 'flashcards' | 'games';
};

const PASTELS = {
  lavender: '#EDE9FE',
  mint: '#DCFCE7',
  peach: '#FFEDD5',
  sky: '#E0F2FE',
  rose: '#FFE4E6',
};

const ICON_COLORS = {
  primary: '#5B5FEF',
  violet: '#8B5CF6',
  green: '#22C55E',
  orange: '#F97316',
  pink: '#EC4899',
  blue: '#3B82F6',
};

export function HomeIllustration({ variant }: Props) {
  if (variant === 'flashcards') {
    return (
      <View style={styles.wrap}>
        <View style={[styles.circleLarge, { backgroundColor: PASTELS.lavender }]} />
        <View style={[styles.circleSmall, { backgroundColor: PASTELS.sky, right: 18, top: 14 }]} />
        <View style={[styles.cardStack, styles.card1, { borderColor: ICON_COLORS.primary }]}>
          <MaterialIcons name="style" size={40} color={ICON_COLORS.primary} />
        </View>
        <View style={[styles.cardStack, styles.card2, { borderColor: ICON_COLORS.violet }]}>
          <MaterialIcons name="style" size={40} color={ICON_COLORS.violet} />
        </View>
        <View style={[styles.cardStack, styles.card3, { borderColor: ICON_COLORS.primary }]}>
          <MaterialIcons name="style" size={40} color={ICON_COLORS.primary} />
        </View>
        <View style={[styles.badge, { backgroundColor: ICON_COLORS.green }]}>
          <MaterialIcons name="star" size={18} color="#fff" />
        </View>
        <Text style={styles.emoji}>📚</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.circleLarge, { backgroundColor: PASTELS.peach }]} />
      <View style={[styles.circleSmall, { backgroundColor: PASTELS.mint, right: 22, top: 12 }]} />
      <MaterialIcons name="star" size={16} color={ICON_COLORS.orange} style={styles.star1} />
      <MaterialIcons name="star" size={12} color={ICON_COLORS.pink} style={styles.star2} />
      <MaterialIcons name="star" size={14} color={ICON_COLORS.blue} style={styles.star3} />
      <View style={[styles.controllerCircle, { backgroundColor: PASTELS.rose }]}>
        <MaterialIcons name="sports-esports" size={46} color={ICON_COLORS.pink} />
      </View>
      <View style={[styles.badge, { backgroundColor: ICON_COLORS.green }]}>
        <MaterialIcons name="check" size={18} color="#fff" />
      </View>
      <Text style={styles.emoji}>🎮</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 132,
    height: 132,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLarge: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  circleSmall: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardStack: {
    position: 'absolute',
    width: 64,
    height: 76,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card1: { transform: [{ rotate: '-12deg' }, { translateX: -26 }, { translateY: 6 }] },
  card2: { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
  card3: { transform: [{ rotate: '12deg' }, { translateX: 26 }, { translateY: 6 }] },
  controllerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 8,
    bottom: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  star1: { position: 'absolute', left: 18, top: 22 },
  star2: { position: 'absolute', right: 20, top: 34 },
  star3: { position: 'absolute', left: 30, bottom: 18 },
  emoji: {
    position: 'absolute',
    right: 6,
    top: 10,
    fontSize: 18,
  },
});