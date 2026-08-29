// ============================================================
// useFavorites — convenience wrapper around store favorites
// ============================================================

import { useStore } from '@store/useStore';
import { useEffect } from 'react';

export function useFavorites() {
  const favorites = useStore((s) => s.favorites);
  const loadFavorites = useStore((s) => s.loadFavorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const isFavorite = useStore((s) => s.isFavorite);

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { favorites, toggleFavorite, isFavorite };
}
