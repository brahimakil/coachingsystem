import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import CustomDrawer from '../components/CustomDrawer';

// Views
import LoginView from '../views/LoginView';
import RegisterView from '../views/RegisterView';
import HomeView from '../views/HomeView';
import CoachesView from '../views/CoachesView';
import CoachDetailView from '../views/CoachDetailView';
import SubscriptionsView from '../views/SubscriptionsView';
import TasksView from '../views/TasksView';
import TaskDetailView from '../views/TaskDetailView';
import ChatsView from '../views/ChatsView';
import ChatDetailView from '../views/ChatDetailView';
import ProfileView from '../views/ProfileView';
import AiChatView from '../views/AiChatView';

import { colors, spacing } from '../styles/theme';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginView} />
      <Stack.Screen name="Register" component={RegisterView} />
    </Stack.Navigator>
  );
};

// Coaches Stack
const CoachesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="CoachesList" 
        component={CoachesView}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CoachDetail" 
        component={CoachDetailView}
        options={{ 
          title: 'Coach Profile',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Tasks Stack
const TasksStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="TasksList" 
        component={TasksView}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailView}
        options={{ 
          title: 'Task Details',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Chats Stack
const ChatsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="ChatsList" 
        component={ChatsView}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChatDetail" 
        component={ChatDetailView}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Main Drawer Navigator
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        drawerStyle: {
          backgroundColor: colors.background,
          width: 280,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveBackgroundColor: `${colors.primary}20`,
        drawerLabelStyle: {
          marginLeft: -3,
          fontSize: 15,
          fontWeight: '500',
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        drawerIconStyle: {
          marginRight: 0,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeView}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Coaches"
        component={CoachesStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="people" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Subscriptions"
        component={SubscriptionsView}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="card" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Tasks"
        component={TasksStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="list" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Chat"
        component={ChatsStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AI Chat"
        component={AiChatView}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="sparkles" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileView}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Main Navigation
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <DrawerNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
