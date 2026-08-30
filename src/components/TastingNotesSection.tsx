// ============================================================
// TastingNotesSection — With Camera & Gallery Photo Uploads (Vector Icons)
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FLAVOR_TAGS } from '@constants';
import { useStore } from '@store/useStore';
import type { CoffeeShop, TastingNote } from '@types';

interface Props {
  shop: CoffeeShop;
}

export const TastingNotesSection: React.FC<Props> = ({ shop }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [brewMethod, setBrewMethod] = useState('V60 Pour-Over');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const addTastingNote = useStore((s) => s.addTastingNote);
  const customNotes = useStore((s) => s.customTastingNotes[shop.id] ?? []);

  const allNotes: TastingNote[] = [...customNotes, ...(shop.tastingNotes ?? [])];
  const recipe = shop.brewRecipe;

  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter((f) => f !== flavor));
    } else {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to attach review photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Image Error', 'Could not access photo library.');
    }
  };

  const handlePostReview = () => {
    if (comment.trim().length === 0) {
      Alert.alert('Review Empty', 'Please share a few words about the coffee flavor or vibe.');
      return;
    }

    addTastingNote({
      shopId: shop.id,
      author: authorName.trim().length > 0 ? authorName : 'Coffee Lover',
      rating,
      notes: selectedFlavors.length > 0 ? selectedFlavors : ['Specialty Roast'],
      brewMethod,
      comment,
      photoUri: photoUri ?? undefined,
    });

    setModalVisible(false);
    setComment('');
    setSelectedFlavors([]);
    setPhotoUri(null);
    Alert.alert('Tasting Note Added', 'Your review and photo are now live for the community.');
  };

  return (
    <View style={styles.container}>
      {/* Official Barista Brew Recipe Card */}
      {recipe && (
        <View style={styles.recipeCard}>
          <View style={styles.recipeHeader}>
            <View style={styles.recipeBadgeContainer}>
              <Feather name="coffee" size={12} color="#6E4822" />
              <Text style={styles.recipeBadge}>Barista Recipe</Text>
            </View>
            <Text style={styles.beanOrigin}>{recipe.beanOrigin}</Text>
          </View>

          <View style={styles.recipeGrid}>
            <View style={styles.recipeItem}>
              <Text style={styles.recipeLabel}>Ratio</Text>
              <Text style={styles.recipeVal}>{recipe.ratio}</Text>
            </View>
            <View style={styles.recipeItem}>
              <Text style={styles.recipeLabel}>Water Temp</Text>
              <Text style={styles.recipeVal}>{recipe.temperature}</Text>
            </View>
            <View style={styles.recipeItem}>
              <Text style={styles.recipeLabel}>Grind Size</Text>
              <Text style={styles.recipeVal}>{recipe.grindSize}</Text>
            </View>
            <View style={styles.recipeItem}>
              <Text style={styles.recipeLabel}>Target Time</Text>
              <Text style={styles.recipeVal}>{recipe.brewTime}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Header + Add Review Button */}
      <View style={styles.sectionHeader}>
        <View>
          <View style={styles.titleWithIcon}>
            <Feather name="message-square" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Community Tasting Notes</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {allNotes.length} verified community flavor notes
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addNoteBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={13} color="#FFFFFF" />
          <Text style={styles.addNoteText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      {/* List of Community Reviews */}
      {allNotes.length > 0 ? (
        allNotes.map((note) => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteTopRow}>
              <View>
                <Text style={styles.noteAuthor}>{note.author}</Text>
                {note.brewMethod && (
                  <Text style={styles.noteBrewMethod}>{note.brewMethod}</Text>
                )}
              </View>
              <View style={styles.starRow}>
                {Array.from({ length: note.rating }).map((_, i) => (
                  <Feather key={i} name="star" size={12} color={COLORS.star} />
                ))}
              </View>
            </View>

            {/* Flavor chips */}
            <View style={styles.flavorsRow}>
              {note.notes.map((flavor) => (
                <View key={flavor} style={styles.flavorChip}>
                  <Text style={styles.flavorChipText}>{flavor}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.noteComment}>{note.comment}</Text>

            {/* User Attached Review Photo */}
            {note.photoUri && (
              <View style={styles.reviewPhotoWrapper}>
                <Image source={{ uri: note.photoUri }} style={styles.reviewPhoto} />
              </View>
            )}

            <Text style={styles.noteTime}>{note.createdAt}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyNotesBox}>
          <Text style={styles.emptyNotesText}>
            No tasting notes logged yet. Be the first to add one!
          </Text>
        </View>
      )}

      {/* Add Review Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Log Your Tasting Note</Text>
            <Text style={styles.modalSubheading}>
              Share flavor notes, brew method, and photo for {shop.name}:
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Star Rating */}
              <Text style={styles.fieldLabel}>Rating</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setRating(st)}
                    style={styles.starTouch}
                  >
                    <Feather
                      name="star"
                      size={24}
                      color={rating >= st ? COLORS.star : '#D8D2C7'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Flavor Wheel Chips */}
              <Text style={styles.fieldLabel}>Flavor Notes Detected</Text>
              <View style={styles.flavorPicker}>
                {FLAVOR_TAGS.map((tag) => {
                  const isPicked = selectedFlavors.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.pickerChip, isPicked && styles.pickerChipActive]}
                      onPress={() => toggleFlavor(tag)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pickerChipText, isPicked && styles.pickerChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Brew Method */}
              <Text style={styles.fieldLabel}>Brew Method</Text>
              <TextInput
                style={styles.input}
                value={brewMethod}
                onChangeText={setBrewMethod}
                placeholder="e.g. V60 Pour-Over, Aeropress, Espresso"
              />

              {/* Photo Upload Attachment */}
              <Text style={styles.fieldLabel}>Attach Brew / Latte Art Photo</Text>
              {photoUri ? (
                <View style={styles.photoPreviewBox}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUri(null)}
                  >
                    <Feather name="x" size={12} color={COLORS.danger} />
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoPickerBtn}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={16} color={COLORS.primary} />
                  <Text style={styles.photoPickerText}>Choose Photo from Gallery</Text>
                </TouchableOpacity>
              )}

              {/* Review Comments */}
              <Text style={styles.fieldLabel}>Your Tasting Experience</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={comment}
                onChangeText={setComment}
                placeholder="Describe the aroma, acidity, mouthfeel, or ambiance..."
                multiline
                numberOfLines={3}
              />

              {/* Author */}
              <Text style={styles.fieldLabel}>Your Name / Alias (Optional)</Text>
              <TextInput
                style={styles.input}
                value={authorName}
                onChangeText={setAuthorName}
                placeholder="e.g. Coffee Wanderer"
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handlePostReview}
              >
                <Text style={styles.modalSubmitText}>Post Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  recipeCard: {
    backgroundColor: '#FAF5ED',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: '#E8DBC8',
    gap: SPACING.xs + 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1E4CE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  recipeBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6E4822',
  },
  beanOrigin: {
    fontSize: 12,
    fontWeight: '700',
    color: '#422B18',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 4,
  },
  recipeItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#EFE5D7',
  },
  recipeLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  recipeVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addNoteBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNoteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteAuthor: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  noteBrewMethod: {
    fontSize: 11.5,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  flavorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 2,
  },
  flavorChip: {
    backgroundColor: '#F4EFE6',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  flavorChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B3621',
  },
  noteComment: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  reviewPhotoWrapper: {
    width: '100%',
    height: 140,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginTop: 4,
  },
  reviewPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noteTime: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  emptyNotesBox: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyNotesText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '88%',
    gap: SPACING.xs,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubheading: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  starPicker: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  starTouch: {
    padding: 4,
  },
  flavorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  pickerChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  pickerChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerChipText: {
    fontSize: 11.5,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSage,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    gap: 6,
    marginBottom: 4,
  },
  photoPickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  photoPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.xs,
  },
  removePhotoBtn: {
    backgroundColor: '#FDEDEC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removePhotoText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.danger,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
