// ============================================================
// ShopEventsSection — Barista Events & Cupping Calendar Preview
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import type { CoffeeEvent } from '@types';
import { useStore } from '@store/useStore';

interface Props {
  shopId: string;
  shopName: string;
  onSelectEvent: (event: CoffeeEvent) => void;
}

export const ShopEventsSection: React.FC<Props> = ({ shopId, shopName, onSelectEvent }) => {
  const events = useStore((s) => s.events);

  // Match events hosted by this shop or display relevant upcoming sessions
  const shopEvents = events.filter((e) => e.shopId === shopId);
  const displayEvents = shopEvents.length > 0 ? shopEvents : events.slice(0, 1);

  if (displayEvents.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="calendar" size={16} color={COLORS.primary} />
          <Text style={styles.title}>Barista Sessions & Pop-ups</Text>
        </View>
        <Text style={styles.subtitle}>Cuppings, workshops & events hosted here</Text>
      </View>

      <View style={styles.eventsList}>
        {displayEvents.map((ev) => (
          <TouchableOpacity
            key={ev.id}
            style={styles.eventCard}
            onPress={() => onSelectEvent(ev)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: ev.imageUrl }} style={styles.eventImage} />

            <View style={styles.eventInfo}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{ev.category}</Text>
              </View>

              <Text style={styles.eventTitle} numberOfLines={2}>
                {ev.title}
              </Text>

              <View style={styles.metaRow}>
                <Feather name="clock" size={11} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{ev.eventDate}</Text>
              </View>

              <View style={styles.bottomRow}>
                <Text style={styles.priceTag}>
                  {ev.pricePhp === 0 ? 'FREE RSVP' : `₱${ev.pricePhp}`}
                </Text>
                <View style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>RSVP Slot ›</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
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
  header: {
    gap: 2,
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
  },
  eventsList: {
    gap: SPACING.sm,
  },
  eventCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
  },
  eventImage: {
    width: 100,
    height: '100%',
    backgroundColor: COLORS.borderLight,
  },
  eventInfo: {
    flex: 1,
    padding: SPACING.sm,
    gap: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceSage,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  viewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  viewBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
