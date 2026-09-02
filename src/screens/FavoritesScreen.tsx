// ============================================================
// FavoritesScreen — Saved Specialty Spots
// ============================================================

import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="bookmark" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Saved Specialty Spots</Text>
        </View>
        {favorites.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {favorites.length} saved {favorites.length === 1 ? 'café' : 'cafés'}
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
            <Feather name="bookmark" size={48} color={COLORS.taupe} />
            <Text style={styles.emptyTitle}>No saved spots yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart on any specialty café in the Discover map to bookmark it here for your next coffee run.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    paddingLeft: 28,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: 90,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
