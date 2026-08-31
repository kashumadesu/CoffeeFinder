// ============================================================
// ReviewComposerModal — Write Tasting Notes & Sensory Reviews
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
import type { BrewMethod, TastingFlavorTag, BeanOrigin } from '@types';
import { hapticSuccess, hapticSelection } from '@utils/haptics';
import { logReviewSubmitted } from '@services/analytics';

interface Props {
  visible: boolean;
  shopId: string;
  shopName: string;
  onClose: () => void;
}

const BREW_METHODS: BrewMethod[] = [
  'V60 Pour Over',
  'AeroPress',
  'Espresso',
  'Cold Brew',
  'French Press',
  'Syphon',
];

const FLAVOR_TAGS: TastingFlavorTag[] = [
  'Floral',
  'Citrus & Bergamot',
  'Brown Sugar',
  'Dark Chocolate',
  'Wild Berry',
  'Jasmine',
  'Caramel',
  'Tropical Fruit',
  'Nutty & Cacao',
  'Smoky Barako',
];

export const ReviewComposerModal: React.FC<Props> = ({
  visible,
  shopId,
  shopName,
  onClose,
}) => {
  const submitReview = useStore((s) => s.submitReview);
  const currentUser = useStore((s) => s.currentUser);

  const [rating, setRating] = useState(5);
  const [brewMethod, setBrewMethod] = useState<BrewMethod>('V60 Pour Over');
  const [selectedTags, setSelectedTags] = useState<TastingFlavorTag[]>(['Floral', 'Brown Sugar']);
  const [beanOrigin, setBeanOrigin] = useState<BeanOrigin | undefined>(undefined);
  const [acidity, setAcidity] = useState(4);
  const [sweetness, setSweetness] = useState(5);
  const [body, setBody] = useState(4);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const toggleTag = (tag: TastingFlavorTag) => {
    hapticSelection();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 4) {
        Alert.alert('Max Tags', 'You can choose up to 4 primary flavor notes.');
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Please allow gallery access to upload a cup photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Review Required', 'Please write a brief tasting note or experience.');
      return;
    }

    await submitReview({
      shopId,
      userId: currentUser?.uid || `user-${Date.now()}`,
      userName: currentUser?.displayName || 'Specialty Coffee Explorer',
      userAvatar: currentUser?.photoURL || undefined,
      rating,
      brewMethod,
      beanOriginTag: beanOrigin,
      flavorTags: selectedTags,
      acidity,
      sweetness,
      body,
      comment: comment.trim(),
      photoUri: photoUri || undefined,
    });

    logReviewSubmitted(shopId, rating, brewMethod, selectedTags);
    hapticSuccess();
    Alert.alert('Review Published!', `Thank you for sharing your tasting notes for "${shopName}".`);
    setComment('');
    setPhotoUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Tasting Notes & Review</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {shopName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Star Rating */}
            <Text style={styles.sectionLabel}>Cup Score</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    hapticSelection();
                    setRating(star);
                  }}
                  style={styles.starBtn}
                >
                  <Feather
                    name="star"
                    size={28}
                    color={star <= rating ? '#F59E0B' : COLORS.borderLight}
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.ratingText}>{rating}.0 / 5.0</Text>
            </View>

            {/* Brew Method */}
            <Text style={styles.sectionLabel}>Brew Extraction Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {BREW_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.chip, brewMethod === method && styles.chipActive]}
                  onPress={() => {
                    hapticSelection();
                    setBrewMethod(method);
                  }}
                >
                  <Text style={[styles.chipText, brewMethod === method && styles.chipTextActive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Philippine Bean Origin (Optional Tag) */}
            <Text style={styles.sectionLabel}>Philippine Single Origin (Optional)</Text>
            <View style={styles.tagsGrid}>
              {[
                { id: undefined, label: 'Standard Blend / Import' },
                { id: 'sagada' as BeanOrigin, label: '🌱 Sagada' },
                { id: 'apo' as BeanOrigin, label: '🏔️ Mt. Apo' },
                { id: 'benguet' as BeanOrigin, label: '🌿 Benguet' },
                { id: 'barako' as BeanOrigin, label: '☕ Barako' },
              ].map((origin) => (
                <TouchableOpacity
                  key={origin.label}
                  style={[styles.chip, beanOrigin === origin.id && styles.chipActive]}
                  onPress={() => {
                    hapticSelection();
                    setBeanOrigin(origin.id);
                  }}
                >
                  <Text style={[styles.chipText, beanOrigin === origin.id && styles.chipTextActive]}>
                    {origin.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Flavor Notes Chips */}
            <Text style={styles.sectionLabel}>Tasting Flavor Notes (Select up to 4)</Text>
            <View style={styles.tagsGrid}>
              {FLAVOR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, isSelected && styles.tagPillActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sensory Balance Sliders */}
            <Text style={styles.sectionLabel}>Sensory Balance</Text>
            <View style={styles.sensoryCard}>
              <View style={styles.sensoryRow}>
                <Text style={styles.sensoryName}>Sweetness</Text>
                <View style={styles.dotsRow}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.dotBtn, val <= sweetness && styles.dotBtnActive]}
                      onPress={() => setSweetness(val)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sensoryRow}>
                <Text style={styles.sensoryName}>Vibrant Acidity</Text>
                <View style={styles.dotsRow}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.dotBtn, val <= acidity && styles.dotBtnActive]}
                      onPress={() => setAcidity(val)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sensoryRow}>
                <Text style={styles.sensoryName}>Mouthfeel & Body</Text>
                <View style={styles.dotsRow}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.dotBtn, val <= body && styles.dotBtnActive]}
                      onPress={() => setBody(val)}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Review Comment Input */}
            <Text style={styles.sectionLabel}>Your Experience & Tasting Notes</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              placeholder="Describe the aroma, extraction quality, barista recommendations, and vibe..."
              placeholderTextColor={COLORS.textMuted}
              value={comment}
              onChangeText={setComment}
            />

            {/* Photo Attachment */}
            <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <Text style={styles.changePhotoText}>Tap to change photo</Text>
                </View>
              ) : (
                <View style={styles.photoPickerPlaceholder}>
                  <Feather name="camera" size={20} color={COLORS.primary} />
                  <Text style={styles.photoPickerText}>Attach Cup or Barista Brew Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Feather name="send" size={16} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Post Tasting Review</Text>
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
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  starBtn: {
    padding: 2,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tagPillActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  tagPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tagPillTextActive: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  sensoryCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sensoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sensoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dotBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.borderLight,
  },
  dotBtnActive: {
    backgroundColor: COLORS.primary,
  },
  commentInput: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  photoPickerBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceWarm,
  },
  photoPickerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoPickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoPreviewWrap: {
    alignItems: 'center',
    gap: 4,
  },
  photoPreview: {
    width: 140,
    height: 90,
    borderRadius: RADIUS.sm,
  },
  changePhotoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    marginTop: 14,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
