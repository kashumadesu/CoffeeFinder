// ============================================================
// AppNavigator — bottom tab + stack navigator
// ============================================================

import React from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { COLORS } from '@constants';
import { MapScreen } from '@screens/MapScreen';
import { ListScreen } from '@screens/ListScreen';
import { FavoritesScreen } from '@screens/FavoritesScreen';
import { DetailScreen } from '@screens/DetailScreen';
import type { RootTabParamList, RootStackParamList } from '@types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// ---- Tab icons ----
function tabIcon(name: string, focused: boolean): React.ReactNode {
  const icons: Record<string, [string, string]> = {
    Map: ['🗺', '🗺'],
    List: ['📋', '📋'],
    Favorites: ['🤍', '❤️'],
  };
  const [normal, active] = icons[name] ?? ['●', '●'];
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {focused ? active : normal}
    </Text>
  );
}

// ---- Main tabs ----
const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 6,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -3 },
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: -4,
      },
    })}
  >
    <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
    <Tab.Screen name="List" component={ListScreen} options={{ title: 'Nearby' }} />
    <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
  </Tab.Navigator>
);

// ---- Root stack (tabs + detail screen) ----
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
