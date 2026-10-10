import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AlertProvider from './src/components/AlertProvider';
import NewsFeedScreen from './src/screens/NewsFeedScreen';
import FixturesScreen from './src/screens/FixturesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();

// Main Navigation Component
function MainNavigator() {
  const { user, loading } = useAuth();

  // Light backgrounds (loading spinner, login screen) need dark status bar
  // icons; the app's tab screens sit under a dark purple header, which
  // needs light icons to stay readable.
  const statusBarStyle = user ? 'light' : 'dark';

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style={statusBarStyle} />
        <ActivityIndicator size="large" color="#38003c" />
      </View>
    );
  }

  // If no user, show login screen
  if (!user) {
    return (
      <>
        <StatusBar style={statusBarStyle} />
        <LoginScreen />
      </>
    );
  }

  // If user is logged in, show app
  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#38003c',
          tabBarInactiveTintColor: '#999',
          headerStyle: { backgroundColor: '#38003c' },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
        }}
      >
        <Tab.Screen
          name="News"
          component={NewsFeedScreen}
          options={{
            title: 'Premier League Pulse',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="soccer-ball-o" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Fixtures"
          component={FixturesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="profile" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

// Root App Component
export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </AuthProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});