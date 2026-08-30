// ============================================================
// PhotoMosaic Component — 3-Photo Tiled Header (Matching Mockup)
// ============================================================

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getPhotoUrl, COLORS, RADIUS } from '@constants';
import type { Photo } from '@types';

interface Props {
  photos?: Photo[];
  galleryUrls?: string[];
  height?: number;
}

const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
];

export const PhotoMosaic: React.FC<Props> = ({
  photos,
  galleryUrls,
  height = 180,
}) => {
  const images: string[] = [];

  if (galleryUrls && galleryUrls.length > 0) {
    images.push(...galleryUrls);
  } else if (photos && photos.length > 0) {
    photos.slice(0, 3).forEach((p) => {
      images.push(getPhotoUrl(p.photoReference, 600));
    });
  }

  // Pad with high quality specialty coffee fallback imagery if less than 3
  while (images.length < 3) {
    images.push(DEFAULT_FALLBACK_IMAGES[images.length % DEFAULT_FALLBACK_IMAGES.length]);
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* Primary Left Image */}
      <View style={styles.mainImageWrapper}>
        <Image source={{ uri: images[0] }} style={styles.image} />
      </View>

      {/* Middle Image */}
      <View style={styles.sideImageWrapper}>
        <Image source={{ uri: images[1] }} style={styles.image} />
      </View>

      {/* Right Image */}
      <View style={styles.sideImageWrapper}>
        <Image source={{ uri: images[2] }} style={styles.image} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    gap: 3,
  },
  mainImageWrapper: {
    flex: 1.6,
    height: '100%',
  },
  sideImageWrapper: {
    flex: 1,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
