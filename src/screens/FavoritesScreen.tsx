// ============================================================
// FavoritesScreen — saved coffee shops list with persistence
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING } from '@constants';
import { useFavorites } from '@hooks/useFavorites';
import { ShopCard } from '@components/ShopCard';
import type { CoffeeShop, RootStackParamList } from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export const FavoritesScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const handlePress = useCallback(
    (shop: CoffeeShop) => nav.navigate('ShopDetail', { shop }),
    [nav],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        {favorites.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {favorites.length} saved {favorites.length === 1 ? 'shop' : 'shops'}
          </Text>
        )}
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShopCard
            shop={item}
            onPress={handlePress}
            onFavoritePress={toggleFavorite}
            isFavorite={isFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on any coffee shop to save it here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: { paddingTop: SPACING.xs, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
