// ============================================================
// EventDetailModal — Barista Cuppings, Workshops & Event Tickets
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import type { CoffeeEvent } from '@types';
import { useStore } from '@store/useStore';
import { hapticSuccess, hapticSelection } from '@utils/haptics';
import { logEventRSVP } from '@services/analytics';

interface Props {
  event: CoffeeEvent | null;
  visible: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<Props> = ({ event, visible, onClose }) => {
  const rsvpEvent = useStore((s) => s.rsvpEvent);
  const cancelRSVP = useStore((s) => s.cancelRSVP);
  const myRsvps = useStore((s) => s.myRsvps);

  if (!event) return null;

  const userRsvp = myRsvps.find((r) => r.eventId === event.id);
  const isBooked = !!userRsvp || event.isRSVPed;
  const remainingSlots = Math.max(0, event.maxSlots - event.bookedSlots);

  const handleRSVP = () => {
    if (isBooked) {
      Alert.alert('Cancel RSVP', 'Are you sure you want to cancel your event registration?', [
        { text: 'Keep Ticket', style: 'cancel' },
        {
          text: 'Cancel Registration',
          style: 'destructive',
          onPress: () => {
            cancelRSVP(event.id);
            hapticSelection();
          },
        },
      ]);
    } else {
      if (remainingSlots <= 0) {
        Alert.alert('Event Full', 'Sorry, all cupping slots for this event have been reserved.');
        return;
      }
      rsvpEvent(event.id);
      logEventRSVP(event.id, event.title, event.shopName, event.pricePhp);
      hapticSuccess();
      Alert.alert(
        'RSVP Confirmed! 🎉',
        `Your ticket for "${event.title}" has been added to your Coffee Passport. Show your ticket code at the entrance.`,
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Image */}
          <View style={styles.imageWrap}>
            <Image source={{ uri: event.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Title & Host */}
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.shopName}>Hosted by {event.shopName}</Text>

            {/* Event Time & Venue Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Feather name="calendar" size={15} color={COLORS.primary} />
                <Text style={styles.infoText}>{event.eventDate}</Text>
              </View>

              <View style={styles.infoRow}>
                <Feather name="clock" size={15} color={COLORS.primary} />
                <Text style={styles.infoText}>{event.eventTime}</Text>
              </View>

              <View style={styles.infoRow}>
                <Feather name="map-pin" size={15} color={COLORS.primary} />
                <Text style={styles.infoText}>{event.venueAddress}</Text>
              </View>

              <View style={styles.infoRow}>
                <Feather name="user" size={15} color={COLORS.primary} />
                <Text style={styles.infoText}>{event.hostName}</Text>
              </View>
            </View>

            {/* Slots & Pricing Bar */}
            <View style={styles.slotsCard}>
              <View>
                <Text style={styles.slotsLabel}>Admission</Text>
                <Text style={styles.priceValue}>
                  {event.pricePhp === 0 ? 'FREE RSVP' : `₱${event.pricePhp}`}
                </Text>
              </View>

              <View style={styles.slotsRight}>
                <Text style={styles.slotsCount}>
                  {remainingSlots} / {event.maxSlots} slots remaining
                </Text>
                <View style={styles.slotTrack}>
                  <View
                    style={[
                      styles.slotFill,
                      { width: `${(event.bookedSlots / event.maxSlots) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Digital Ticket Code if Booked */}
            {isBooked && (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Feather name="check-circle" size={16} color="#1B5E20" />
                  <Text style={styles.ticketTitle}>Official Event Ticket Pass</Text>
                </View>
                <Text style={styles.ticketCode}>
                  {userRsvp?.ticketCode || 'KAPE-VIP901'}
                </Text>
                <Text style={styles.ticketSub}>
                  Present this digital pass to the barista upon arrival.
                </Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.descTitle}>About This Session</Text>
            <Text style={styles.descText}>{event.description}</Text>

            {/* Action RSVP Button */}
            <TouchableOpacity
              style={[
                styles.rsvpBtn,
                isBooked ? styles.rsvpBtnBooked : remainingSlots <= 0 && styles.rsvpBtnDisabled,
              ]}
              onPress={handleRSVP}
              activeOpacity={0.85}
            >
              <Feather name={isBooked ? 'check' : 'calendar'} size={16} color="#FFFFFF" />
              <Text style={styles.rsvpBtnText}>
                {isBooked
                  ? 'Registered (Tap to Cancel)'
                  : remainingSlots <= 0
                  ? 'Event Sold Out'
                  : event.pricePhp === 0
                  ? 'Reserve Free Spot'
                  : `Book Ticket (₱${event.pricePhp})`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  imageWrap: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.borderLight,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    flex: 1,
  },
  slotsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  slotsLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  slotsRight: {
    width: 140,
    gap: 4,
    alignItems: 'flex-end',
  },
  slotsCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  slotTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  slotFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  ticketCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B5E20',
  },
  ticketCode: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B5E20',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginVertical: 4,
  },
  ticketSub: {
    fontSize: 11,
    color: '#2E7D32',
    textAlign: 'center',
  },
  descTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  descText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  rsvpBtn: {
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  rsvpBtnBooked: {
    backgroundColor: '#2E7D32',
  },
  rsvpBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  rsvpBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
