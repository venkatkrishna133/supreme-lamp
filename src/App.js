import { registerRootComponent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { MenuProvider } from 'react-native-popup-menu';
import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';

import Chat from './screens/Chat';
import Help from './screens/Help';
import Chats from './screens/Chats';
import Login from './screens/Login';
import Users from './screens/Users';
import About from './screens/About';
import Group from './screens/Group';
import SignUp from './screens/SignUp';
import Profile from './screens/Profile';
import Account from './screens/Account';
import { auth } from './config/firebase';
import Settings from './screens/Settings';
import ChatInfo from './screens/ChatInfo';
import { colors } from './config/constants';
import ChatMenu from './components/ChatMenu';
import NotesList from './screens/NotesList.tsx';
import ChatHeader from './components/ChatHeader';
import NoteEditor from './screens/NoteEditor.tsx';
import { UnlockContext, UnlockProvider } from './contexts/UnlockContext';
import { UnreadMessagesContext, UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import {
  AuthenticatedUserContext,
  AuthenticatedUserProvider,
} from './contexts/AuthenticatedUserContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const NotesStack = createStackNavigator();

const QuickHideButton = () => {
  const { setUnlocked } = useContext(UnlockContext);
  return (
    <TouchableOpacity onPress={() => setUnlocked(false)} style={{ marginRight: 10 }}>
      <Text style={{ color: colors.primary }}>Hide</Text>
    </TouchableOpacity>
  );
};

const TabNavigator = () => {
  const { unreadCount, setUnreadCount } = useContext(UnreadMessagesContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = route.name === 'Chats' ? 'chatbubbles' : 'settings';
          iconName += focused ? '' : '-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        presentation: 'modal',
        headerRight: () => <QuickHideButton />,
      })}
    >
      <Tab.Screen name="Chats" options={{ tabBarBadge: unreadCount > 0 ? unreadCount : null }}>
        {() => <Chats setUnreadCount={setUnreadCount} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerRight: () => <QuickHideButton />,
    }}
  >
    <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen
      name="Chat"
      component={Chat}
      options={({ route }) => ({
        headerTitle: () => (
          <ChatHeader chatName={route.params.chatName} chatId={route.params.id} />
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <QuickHideButton />
            <ChatMenu chatName={route.params.chatName} chatId={route.params.id} />
          </View>
        ),
      })}
    />
    <Stack.Screen name="Users" component={Users} options={{ title: 'Select User' }} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="About" component={About} />
    <Stack.Screen name="Help" component={Help} />
    <Stack.Screen name="Account" component={Account} />
    <Stack.Screen name="Group" component={Group} options={{ title: 'New Group' }} />
    <Stack.Screen name="ChatInfo" component={ChatInfo} options={{ title: 'Chat Information' }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="SignUp" component={SignUp} />
  </Stack.Navigator>
);

const NotesStackNavigator = () => (
  <NotesStack.Navigator>
    <NotesStack.Screen name="NotesList" component={NotesList} />
    <NotesStack.Screen name="NoteEditor" component={NoteEditor} />
  </NotesStack.Navigator>
);

const RootNavigator = () => {
  const { user, setUser } = useContext(AuthenticatedUserContext);
  const { unlocked } = useContext(UnlockContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser || null);
      setIsLoading(false);
    });

    return unsubscribeAuth;
  }, [setUser]);

  if (!unlocked) {
    return (
      <NavigationContainer>
        <NotesStackNavigator />
      </NavigationContainer>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>{user ? <MainStack /> : <AuthStack />}</NavigationContainer>
  );
};

const App = () => (
  <MenuProvider>
    <UnlockProvider>
      <AuthenticatedUserProvider>
        <UnreadMessagesProvider>
          <RootNavigator />
        </UnreadMessagesProvider>
      </AuthenticatedUserProvider>
    </UnlockProvider>
  </MenuProvider>
);

export default registerRootComponent(App);
