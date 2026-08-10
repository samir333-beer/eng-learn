import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIllustration } from '@/components/learn/HomeIllustration';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemePalette } from '@/hooks/use-theme-palette';

type ModeCard = {
  id: string;
  title: string;
  description: string;
  illustration: 'flashcards' | 'games';
  emoji: string;
  route: '/flashcards' | '/(tabs)/practice';
};

export default function HomeScreen() {
  const p = useThemePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const firstName = (user?.username ?? 'друг').split(/[\s_@]/)[0];

  const cards: ModeCard[] = [
    {
      id: 'flashcards',
      title: 'Флеш-карточки',
      description: 'Листай вверх и вниз, чтобы учить новые слова.',
      illustration: 'flashcards',
      emoji: '🃏',
      route: '/flashcards',
    },
    {
      id: 'mini-games',
      title: 'Мини-игры',
      description: 'Практикуйся и проверяй знания с удовольствием.',
      illustration: 'games',
      emoji: '🎮',
      route: '/(tabs)/practice',
    },
  ];

  const renderCard = ({ item }: { item: ModeCard }) => (
    <Pressable
      onPress={() => router.push(item.route as Href)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: p.card },
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}>
      <HomeIllustration variant={item.illustration} />
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <LinearGradient
            colors={p.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emojiBadge}>
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: p.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: p.textMuted }]}>{item.description}</Text>
        <View style={styles.cardLink}>
          <Text style={[styles.cardLinkText, { color: p.primary }]}>Открыть</Text>
          <IconSymbol name="chevron.right" size={18} color={p.primary} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.greeting, { color: p.textMuted }]}>Хаб обучения</Text>
          <Text style={[styles.headerTitle, { color: p.text }]}>
            Привет, {firstName}! 👋
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/modal')}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: p.card, borderColor: p.border },
            pressed && { opacity: 0.7 },
          ]}>
          <IconSymbol name="plus" size={24} color={p.text} />
        </Pressable>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 1,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});