// ============================================================
// App.tsx — root entry point
// ============================================================

import 'react-native-gesture-handler'; // must be first import
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { StyleSheet, View } from 'react-native';

import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

enableScreens(true);

export default function App() {
  const loadFavorites = useStore((s) => s.loadFavorites);

  // Load persisted favorites on startup
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
