// ============================================================
// ImageLightboxModal — Fullscreen High-Resolution Image Viewer
// ============================================================

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SPACING } from '@constants';
import { hapticLight } from '@utils/haptics';

interface Props {
  visible: boolean;
  imageUri: string | null;
  title?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageLightboxModal: React.FC<Props> = ({
  visible,
  imageUri,
  title,
  onClose,
}) => {
  if (!imageUri) return null;

  const handleShare = async () => {
    hapticLight();
    try {
      await Share.share({
        message: `Check out this specialty coffee photo on KapeRoute: ${imageUri}`,
        url: imageUri,
      });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header Controls */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {title && (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            )}

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={handleShare}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="share-2" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Centered High-Res Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
});
