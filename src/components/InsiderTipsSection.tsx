// ============================================================
// InsiderTipsSection — Community Tips on Outlets, Parking & Off-Menu
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@constants';
import { hapticLight, hapticSuccess, hapticSelection } from '@utils/haptics';
import type { CoffeeShop, InsiderTip } from '@types';

interface Props {
  shop: CoffeeShop;
}

const CATEGORIES: { id: InsiderTip['category'] | 'all'; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'all', label: 'All Tips', icon: 'list' },
  { id: 'plugs', label: '⚡ Plugs', icon: 'zap' },
  { id: 'parking', label: '🚗 Parking', icon: 'map-pin' },
  { id: 'off_menu', label: '☕ Off-Menu', icon: 'coffee' },
  { id: 'ac', label: '❄️ A/C', icon: 'sun' },
];

export const InsiderTipsSection: React.FC<Props> = ({ shop }) => {
  const [tips, setTips] = useState<InsiderTip[]>(shop.insiderTips ?? [
    {
      id: `default-tip-${shop.id}-1`,
      shopId: shop.id,
      authorName: 'Barista Recommendation',
      category: 'plugs',
      text: 'Outlets are available at the main booths and communal counter. Ask the barista if you need an extension cord!',
      upvotes: 14,
      createdAt: 'Recent',
    },
    {
      id: `default-tip-${shop.id}-2`,
      shopId: shop.id,
      authorName: 'Regular Customer',
      category: 'off_menu',
      text: 'Try asking for their single origin V60 or iced Spanish latte with oat milk.',
      upvotes: 9,
      createdAt: '3 days ago',
    },
  ]);

  const [activeCategory, setActiveCategory] = useState<InsiderTip['category'] | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InsiderTip['category']>('plugs');
  const [authorName, setAuthorName] = useState('');
  const [tipText, setTipText] = useState('');

  const filteredTips = tips.filter((t) => activeCategory === 'all' || t.category === activeCategory);

  const handleUpvote = (tipId: string) => {
    hapticLight();
    setTips((prev) =>
      prev.map((t) => (t.id === tipId ? { ...t, upvotes: t.upvotes + 1 } : t)),
    );
  };

  const handlePostTip = () => {
    if (!tipText.trim()) {
      Alert.alert('Tip Required', 'Please type your tip before posting.');
      return;
    }

    hapticSuccess();
    const newTip: InsiderTip = {
      id: `user-tip-${Date.now()}`,
      shopId: shop.id,
      authorName: authorName.trim() || 'Verified Explorer',
      category: selectedCategory,
      text: tipText.trim(),
      upvotes: 1,
      createdAt: 'Just now',
    };

    setTips([newTip, ...tips]);
    setModalVisible(false);
    setTipText('');
    setAuthorName('');
    Alert.alert('Salamat!', 'Your insider tip is now live for other coffee lovers!');
  };

  const getCategoryBadge = (cat: InsiderTip['category']) => {
    switch (cat) {
      case 'plugs':
        return { label: '⚡ Plugs', bg: '#E8F5E9', text: '#1B5E20' };
      case 'parking':
        return { label: '🚗 Parking', bg: '#E3F2FD', text: '#0D47A1' };
      case 'off_menu':
        return { label: '☕ Off-Menu', bg: '#F3E5F5', text: '#4A148C' };
      case 'ac':
        return { label: '❄️ A/C & Vibe', bg: '#FFF3E0', text: '#E65100' };
      default:
        return { label: '💡 Tip', bg: '#ECEFF1', text: '#37474F' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Feather name="message-circle" size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Community Insider Tips</Text>
            <Text style={styles.sectionSub}>Plugs, parking clamping, & off-menu drinks</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addTipBtn}
          onPress={() => {
            hapticLight();
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={13} color="#FFFFFF" />
          <Text style={styles.addTipBtnText}>Post Tip</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => {
                hapticSelection();
                setActiveCategory(cat.id);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tips List */}
      <View style={styles.tipsList}>
        {filteredTips.map((item) => {
          const badge = getCategoryBadge(item.category);
          return (
            <View key={item.id} style={styles.tipCard}>
              <View style={styles.tipCardTop}>
                <View style={styles.authorRow}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorInitial}>
                      {item.authorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>{item.authorName}</Text>
                    <Text style={styles.tipTime}>{item.createdAt}</Text>
                  </View>
                </View>

                <View style={[styles.tipCatBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.tipCatBadgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.tipBodyText}>{item.text}</Text>

              {/* Upvote Button */}
              <View style={styles.tipBottomRow}>
                <TouchableOpacity
                  style={styles.upvoteBtn}
                  onPress={() => handleUpvote(item.id)}
                  activeOpacity={0.75}
                >
                  <Feather name="thumbs-up" size={12} color={COLORS.primary} />
                  <Text style={styles.upvoteText}>Helpful ({item.upvotes})</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add Insider Tip Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Share an Insider Tip</Text>
                <Text style={styles.modalSub}>Help fellow coffee lovers visiting {shop.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Category Select */}
            <Text style={styles.inputLabel}>Tip Category:</Text>
            <View style={styles.modalCategoryRow}>
              {[
                { id: 'plugs' as const, label: '⚡ Plugs / Sockets' },
                { id: 'parking' as const, label: '🚗 Parking & Towing' },
                { id: 'off_menu' as const, label: '☕ Off-Menu Drinks' },
                { id: 'ac' as const, label: '❄️ A/C & Comfort' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.modalCatChip,
                    selectedCategory === c.id && styles.modalCatChipActive,
                  ]}
                  onPress={() => setSelectedCategory(c.id)}
                >
                  <Text
                    style={[
                      styles.modalCatChipText,
                      selectedCategory === c.id && styles.modalCatChipTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Author Name */}
            <Text style={styles.inputLabel}>Your Name or Handle (Optional):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Coffee Nomad or Bea L."
              placeholderTextColor={COLORS.textMuted}
              value={authorName}
              onChangeText={setAuthorName}
            />

            {/* Tip Description */}
            <Text style={styles.inputLabel}>Your Insider Tip:</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g. Best table has 2 outlets behind the plant. Free parking before 3 PM along the side street."
              placeholderTextColor={COLORS.textMuted}
              value={tipText}
              onChangeText={setTipText}
              multiline
              numberOfLines={4}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitTipBtn}
              onPress={handlePostTip}
              activeOpacity={0.88}
            >
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.submitTipBtnText}>Post Insider Tip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  addTipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addTipBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tipsList: {
    gap: SPACING.sm,
    marginTop: 4,
  },
  tipCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  tipCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D9CCBE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A3423',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tipTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  tipCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tipCatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tipBodyText: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    lineHeight: 17,
  },
  tipBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 4,
    marginTop: 2,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  upvoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm + 2,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalCatChip: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCatChipActive: {
    backgroundColor: COLORS.surfaceSage,
    borderColor: COLORS.primary,
  },
  modalCatChipText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalCatChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitTipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    marginTop: 8,
  },
  submitTipBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
