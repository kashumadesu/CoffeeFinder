// ============================================================
// AppNavigator — 4-Tab Bottom Navigation (Matching Mockup)
// ============================================================

import React from 'react';
import { Text, Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { COLORS } from '@constants';
import { MapScreen } from '@screens/MapScreen';
import { FavoritesScreen } from '@screens/FavoritesScreen';
import { OwnerPortalScreen } from '@screens/OwnerPortalScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { DetailScreen } from '@screens/DetailScreen';
import type { RootTabParamList, RootStackParamList } from '@types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// ---- Tab Icons matching mockup bottom bar ----
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, { icon: string; label: string }> = {
    Discover: { icon: '🌿', label: 'Discover' },
    Saved: { icon: '🔖', label: 'Saved' },
    OwnerPortal: { icon: '🏪', label: 'Owner Portal' },
    Profile: { icon: '👤', label: 'Profile' },
  };

  const item = icons[name] ?? { icon: '☕', label: name };

  return (
    <View style={styles.tabIconWrapper}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {item.icon}
      </Text>
    </View>
  );
}

// ---- Main 4-Tab Bar ----
const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: '#9B9690',
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        height: Platform.OS === 'ios' ? 84 : 66,
        paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        paddingTop: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -3 },
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
      },
    })}
  >
    <Tab.Screen
      name="Discover"
      component={MapScreen}
      options={{ title: 'Discover' }}
    />
    <Tab.Screen
      name="Saved"
      component={FavoritesScreen}
      options={{ title: 'Saved' }}
    />
    <Tab.Screen
      name="OwnerPortal"
      component={OwnerPortalScreen}
      options={{ title: 'Owner Portal' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

// ---- Root Stack ----
export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ShopDetail"
        component={DetailScreen}
        options={{
          presentation: 'card',
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
