// ============================================================
// AppNavigator — 4-Tab Bottom Navigation with Vector Icons
// ============================================================

import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@constants';
import { MapScreen } from '@screens/MapScreen';
import { FavoritesScreen } from '@screens/FavoritesScreen';
import { OwnerPortalScreen } from '@screens/OwnerPortalScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { DetailScreen } from '@screens/DetailScreen';
import type { RootTabParamList, RootStackParamList } from '@types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const TAB_ICONS: Record<string, FeatherIconName> = {
  Discover: 'map',
  Saved: 'bookmark',
  OwnerPortal: 'briefcase',
  Profile: 'user',
};

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);
  const tabHeight = (Platform.OS === 'ios' ? 56 : 58) + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => {
          const iconName = TAB_ICONS[route.name] ?? 'coffee';
          return <Feather name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9B9690',
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Discover" component={MapScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Saved" component={FavoritesScreen} options={{ title: 'Saved' }} />
      <Tab.Screen name="OwnerPortal" component={OwnerPortalScreen} options={{ title: 'Owner' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ShopDetail"
        component={DetailScreen}
        options={{ presentation: 'card', animationEnabled: true }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);
