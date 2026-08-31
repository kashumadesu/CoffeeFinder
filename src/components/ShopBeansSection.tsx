// ============================================================
// ShopBeansSection — Roastery Fresh Coffee Beans Shelf
// ============================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import type { CoffeeBean, GrindType } from '@types';
import { useStore } from '@store/useStore';
import { hapticSuccess, hapticSelection } from '@utils/haptics';

interface Props {
  shopId: string;
  shopName: string;
  onOpenCart: () => void;
}

const GRIND_OPTIONS: GrindType[] = [
  'Whole Bean',
  'Espresso (Fine)',
  'Pour Over / Drip (Medium)',
  'French Press / Cold Brew (Coarse)',
];

export const ShopBeansSection: React.FC<Props> = ({ shopId, shopName, onOpenCart }) => {
  const allBeans = useStore((s) => s.beans);
  const addToCart = useStore((s) => s.addToCart);
  const cart = useStore((s) => s.cart);

  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);
  const [selectedGrind, setSelectedGrind] = useState<GrindType>('Whole Bean');

  // Filter beans matching this roaster shop or show recommended single origins
  const roasterBeans = allBeans.filter((b) => b.roasterShopId === shopId);
  const displayBeans = roasterBeans.length > 0 ? roasterBeans : allBeans.slice(0, 2);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (bean: CoffeeBean) => {
    hapticSuccess();
    addToCart(bean, selectedGrind, 1);
    Alert.alert(
      'Added to Cart!',
      `1x "${bean.name}" (${selectedGrind}) added to your coffee bean order.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'View Cart & Checkout', onPress: onOpenCart },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Feather name="package" size={16} color={COLORS.primary} />
            <Text style={styles.title}>Roaster's Fresh Beans</Text>
          </View>
          <Text style={styles.subtitle}>Direct single-origin pre-orders & retail bags</Text>
        </View>

        {totalCartCount > 0 && (
          <TouchableOpacity style={styles.cartPillBtn} onPress={onOpenCart} activeOpacity={0.85}>
            <Feather name="shopping-bag" size={13} color="#FFFFFF" />
            <Text style={styles.cartPillText}>Cart ({totalCartCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grind Selector Pill Bar */}
      <View style={styles.grindBar}>
        <Text style={styles.grindLabel}>Select Grind:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.grindScroll}>
          {GRIND_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.grindChip, selectedGrind === g && styles.grindChipActive]}
              onPress={() => {
                hapticSelection();
                setSelectedGrind(g);
              }}
            >
              <Text
                style={[styles.grindChipText, selectedGrind === g && styles.grindChipTextActive]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Beans Horizontal Carousel / List */}
      <View style={styles.beansGrid}>
        {displayBeans.map((bean) => (
          <View key={bean.id} style={styles.beanCard}>
            <Image source={{ uri: bean.imageUrl }} style={styles.beanImage} resizeMode="cover" />

            <View style={styles.beanBody}>
              <View style={styles.beanTopRow}>
                <View style={styles.originTag}>
                  <Text style={styles.originTagText}>{bean.origin}</Text>
                </View>
                <Text style={styles.roastDateText}>{bean.roastDate}</Text>
              </View>

              <Text style={styles.beanName}>{bean.name}</Text>
              <Text style={styles.beanVarietal}>
                {bean.varietal} • {bean.process} • {bean.altitudeMasl} MASL
              </Text>

              {/* Tasting Notes */}
              <View style={styles.notesRow}>
                {bean.tastingNotes.map((note) => (
                  <View key={note} style={styles.noteChip}>
                    <Text style={styles.noteChipText}>{note}</Text>
                  </View>
                ))}
              </View>

              {/* Bottom Price & Add to Cart */}
              <View style={styles.beanBottomRow}>
                <View>
                  <Text style={styles.priceText}>₱{bean.pricePhp}</Text>
                  <Text style={styles.weightText}>{bean.bagWeightGrams}g bag</Text>
                </View>

                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={() => handleAddToCart(bean)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={13} color="#FFFFFF" />
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  cartPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  cartPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  grindBar: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  grindLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  grindScroll: {
    flexDirection: 'row',
  },
  grindChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
  },
  grindChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  grindChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  grindChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  beansGrid: {
    gap: SPACING.sm,
  },
  beanCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
  },
  beanImage: {
    width: 105,
    height: '100%',
    backgroundColor: COLORS.borderLight,
  },
  beanBody: {
    flex: 1,
    padding: SPACING.sm,
    gap: 4,
  },
  beanTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  originTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  originTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1B5E20',
  },
  roastDateText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  beanName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  beanVarietal: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 2,
  },
  noteChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noteChipText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#E65100',
  },
  beanBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  weightText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  addCartText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
