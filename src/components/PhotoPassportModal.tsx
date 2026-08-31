// ============================================================
// PhotoPassportModal — Camera & Photo Check-In for Digital Stamps
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, REGION_HUBS } from '@constants';
import { useStore } from '@store/useStore';
import { hapticSuccess, hapticMedium, hapticLight } from '@utils/haptics';
import type { CoffeeShop } from '@types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRESET_CUP_PHOTOS = [
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=700&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&q=80',
];

export const PhotoPassportModal: React.FC<Props> = ({ visible, onClose }) => {
  const shops = useStore((s) => s.shops);
  const addPassportCheckIn = useStore((s) => s.addPassportCheckIn);
  const toggleShopVisited = useStore((s) => s.toggleShopVisited);

  const [selectedShop, setSelectedShop] = useState<CoffeeShop>(shops[0] || null);
  const [photoUri, setPhotoUri] = useState<string>(PRESET_CUP_PHOTOS[0]);
  const [caption, setCaption] = useState('');

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access to take a photo of your cup.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPhotoUri(res.assets[0].uri);
        hapticMedium();
      }
    } catch {}
  };

  const handlePickGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow photo library access.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPhotoUri(res.assets[0].uri);
        hapticMedium();
      }
    } catch {}
  };

  const handleSaveStamp = () => {
    if (!selectedShop) return;

    hapticSuccess();

    // Map shop to regional hub
    const matchedHub = REGION_HUBS.find(
      (h) => h.id === selectedShop.regionId || selectedShop.vicinity.toLowerCase().includes(h.name.toLowerCase().split(' ')[0]),
    ) ?? REGION_HUBS[0];

    const isNew = addPassportCheckIn(
      selectedShop.id,
      selectedShop.name,
      matchedHub.name,
      matchedHub.island.includes('Visayas') ? 'Visayas' : matchedHub.island.includes('Mindanao') ? 'Mindanao' : 'Luzon',
    );

    toggleShopVisited(selectedShop.id, selectedShop.name, matchedHub.id, selectedShop.vicinity);

    Alert.alert(
      isNew ? 'Stamp Unlocked! 🏆' : 'Cup Check-in Saved! ☕',
      `Your cup photo at "${selectedShop.name}" has been stamped to your Philippine Coffee Passport (${matchedHub.name}). You've earned Regional Explorer XP!`,
      [{ text: 'View Passport', onPress: onClose }],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Feather name="camera" size={18} color="#1B5E20" />
              </View>
              <View>
                <Text style={styles.title}>Photo Passport Check-In</Text>
                <Text style={styles.subTitle}>Take a photo of your cup or café to earn digital stamps</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Photo Preview Card with Stamp Watermark */}
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />

              <View style={styles.stampBadgeOverlay}>
                <Feather name="award" size={12} color="#FFFFFF" />
                <Text style={styles.stampBadgeText}>
                  {selectedShop?.name ?? 'Philippine Specialty Coffee'}
                </Text>
              </View>
            </View>

            {/* Camera / Gallery Trigger Buttons */}
            <View style={styles.photoActionsRow}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
                <Feather name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.photoActionText}>Take Camera Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickGallery} activeOpacity={0.85}>
                <Feather name="image" size={16} color={COLORS.primary} />
                <Text style={styles.photoActionText}>Upload from Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Preset Coffee Photos */}
            <Text style={styles.sectionLabel}>Or Choose a Sample Photo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {PRESET_CUP_PHOTOS.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.presetThumbWrap, photoUri === uri && styles.presetThumbWrapActive]}
                  onPress={() => {
                    hapticLight();
                    setPhotoUri(uri);
                  }}
                >
                  <Image source={{ uri }} style={styles.presetThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Select Café */}
            <Text style={styles.sectionLabel}>Select Specialty Café:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopChipsScroll}>
              {shops.map((shop) => {
                const isSelected = selectedShop?.id === shop.id;
                return (
                  <TouchableOpacity
                    key={shop.id}
                    style={[styles.shopChip, isSelected && styles.shopChipActive]}
                    onPress={() => {
                      hapticLight();
                      setSelectedShop(shop);
                    }}
                  >
                    <Feather
                      name="coffee"
                      size={12}
                      color={isSelected ? '#FFFFFF' : COLORS.textPrimary}
                    />
                    <Text style={[styles.shopChipText, isSelected && styles.shopChipTextActive]}>
                      {shop.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Tasting Caption */}
            <Text style={styles.sectionLabel}>Tasting Note / Caption (Optional):</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="e.g. Delicious Sagada pour-over with bright honey notes..."
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Submit Stamp Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveStamp} activeOpacity={0.88}>
              <Feather name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Stamp Passport & Earn XP</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '90%',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    marginTop: 6,
  },
  photoContainer: {
    position: 'relative',
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stampBadgeOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(27, 94, 32, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stampBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4F7F5',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  presetThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  presetThumbWrapActive: {
    borderColor: COLORS.primary,
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  shopChipsScroll: {
    flexDirection: 'row',
  },
  shopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  shopChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  shopChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shopChipTextActive: {
    color: '#FFFFFF',
  },
  captionInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B5E20',
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    marginTop: 16,
    marginBottom: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
