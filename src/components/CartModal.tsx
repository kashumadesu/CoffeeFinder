// ============================================================
// CartModal — Shopping Cart & Direct Roastery Checkout (GCash / Maya)
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import { useStore } from '@store/useStore';
import { hapticSuccess, hapticSelection } from '@utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<Props> = ({ visible, onClose }) => {
  const cart = useStore((s) => s.cart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const checkoutOrder = useStore((s) => s.checkoutOrder);

  const [deliveryAddress, setDeliveryAddress] = useState('Unit 402, Tomas Morato, Quezon City');
  const [recipientContact, setRecipientContact] = useState('+63 917 888 2341');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | 'card'>('gcash');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.bean.pricePhp * item.quantity, 0);
  const shippingFee = cart.length > 0 ? 99 : 0; // Flat Metro Manila Lalamove / J&T express
  const total = subtotal + shippingFee;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!deliveryAddress.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your shipping address.');
      return;
    }

    setIsProcessing(true);
    setTimeout(async () => {
      await checkoutOrder(deliveryAddress, paymentMethod);
      setIsProcessing(false);
      hapticSuccess();
      Alert.alert(
        'Roast Order Placed! ☕',
        `Your ₱${total.toLocaleString()} single-origin bean order has been confirmed with the roasters. You will receive a tracking link via SMS (${recipientContact}).`,
        [{ text: 'Great!', onPress: onClose }],
      );
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <View style={styles.headerTitleRow}>
                <Feather name="shopping-bag" size={18} color={COLORS.primary} />
                <Text style={styles.title}>Roastery Bean Cart</Text>
              </View>
              <Text style={styles.subtitle}>Direct dispatch from Philippine specialty roasters</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="package" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Your bean bag is empty</Text>
              <Text style={styles.emptySub}>
                Explore Philippine single-origin coffees from Sagada, Mt. Apo, Benguet & Batangas.
              </Text>
              <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
                <Text style={styles.continueBtnText}>Explore Roastery Shelf</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Items List */}
              <View style={styles.itemsList}>
                {cart.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Image source={{ uri: item.bean.imageUrl }} style={styles.itemImage} />

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.bean.name}
                      </Text>
                      <Text style={styles.itemRoaster}>{item.bean.roasterName}</Text>
                      <Text style={styles.itemGrind}>Grind: {item.grind}</Text>
                      <Text style={styles.itemPrice}>₱{item.bean.pricePhp}</Text>
                    </View>

                    {/* Quantity Controls */}
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          hapticSelection();
                          updateCartQuantity(item.id, item.quantity - 1);
                        }}
                      >
                        <Feather name="minus" size={12} color={COLORS.textPrimary} />
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          hapticSelection();
                          updateCartQuantity(item.id, item.quantity + 1);
                        }}
                      >
                        <Feather name="plus" size={12} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Delivery Details */}
              <Text style={styles.sectionLabel}>Shipping & Delivery Address</Text>
              <View style={styles.inputWrap}>
                <Feather name="map-pin" size={14} color={COLORS.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Delivery Address (Metro Manila & Nationwide)"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />
              </View>

              <View style={[styles.inputWrap, { marginTop: 6 }]}>
                <Feather name="phone" size={14} color={COLORS.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Recipient Contact Phone"
                  value={recipientContact}
                  onChangeText={setRecipientContact}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Payment Method */}
              <Text style={styles.sectionLabel}>Instant Cashless Payment</Text>
              <View style={styles.paymentMethodsRow}>
                {[
                  { id: 'gcash', label: '🔵 GCash / QRPh' },
                  { id: 'maya', label: '🟢 Maya Pay' },
                  { id: 'card', label: '💳 Credit / Debit' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.paymentMethodChip,
                      paymentMethod === p.id && styles.paymentMethodChipActive,
                    ]}
                    onPress={() => {
                      hapticSelection();
                      setPaymentMethod(p.id as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        paymentMethod === p.id && styles.paymentMethodTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Order Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({cart.length} items)</Text>
                  <Text style={styles.summaryValue}>₱{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Express Courier Shipping (J&T / Lalamove)</Text>
                  <Text style={styles.summaryValue}>₱{shippingFee}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.totalLabel}>Total Payment</Text>
                  <Text style={styles.totalValue}>₱{total.toLocaleString()}</Text>
                </View>
              </View>

              {/* Checkout Button */}
              <TouchableOpacity
                style={[styles.checkoutBtn, isProcessing && { opacity: 0.7 }]}
                onPress={handleCheckout}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <Feather name="lock" size={15} color="#FFFFFF" />
                <Text style={styles.checkoutBtnText}>
                  {isProcessing ? 'Connecting to PayMongo…' : `Pay ₱${total.toLocaleString()} via GCash`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
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
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  continueBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  continueBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.borderLight,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  itemRoaster: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  itemGrind: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 14,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  textInput: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textPrimary,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentMethodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  summaryTotalRow: {
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  totalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  checkoutBtn: {
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
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
