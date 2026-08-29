// ============================================================
// ListScreen — full-page FlatList of nearby coffee shops
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING } from '@constants';
import { useStore } from '@store/useStore';
import { useFavorites } from '@hooks/useFavorites';
import { FilterBar } from '@components/FilterBar';
import { ShopCard } from '@components/ShopCard';
import type { CoffeeShop, RootStackParamList } from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export const ListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const shops = useStore((s) => s.shops);
  const isLoading = useStore((s) => s.isLoading);
  const userLocation = useStore((s) => s.userLocation);
  const fetchNearbyShops = useStore((s) => s.fetchNearbyShops);
  const { toggleFavorite, isFavorite } = useFavorites();

  const handlePress = useCallback(
    (shop: CoffeeShop) => nav.navigate('ShopDetail', { shop }),
    [nav],
  );

  const handleRefresh = () => {
    if (userLocation) fetchNearbyShops(userLocation);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Coffee</Text>
        {shops.length > 0 && (
          <Text style={styles.headerSubtitle}>{shops.length} places found</Text>
        )}
      </View>

      <FilterBar />

      <FlatList
        data={shops}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                <Text style={styles.emptyIcon}>☕</Text>
                <Text style={styles.emptyTitle}>No coffee shops found</Text>
                <Text style={styles.emptySubtitle}>
                  Try expanding the radius or removing filters.
                </Text>
              </>
            )}
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
