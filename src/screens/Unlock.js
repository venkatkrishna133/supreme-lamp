/* eslint-disable import/no-unresolved */
/* eslint-disable react/prop-types */
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { UnlockContext } from '../contexts/UnlockContext';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';

const Unlock = ({ navigation }) => {
  const { setUnlocked } = useContext(UnlockContext);
  const { user } = useContext(AuthenticatedUserContext);

  useEffect(() => {
    const authenticate = async () => {
      const result = await LocalAuthentication.authenticateAsync();
      if (result.success) {
        setUnlocked(true);
        navigation.reset({
          index: 0,
          routes: [{ name: user ? 'Chat' : 'Auth' }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Notes' }] });
      }
    };
    authenticate();
  }, [navigation, setUnlocked, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default Unlock;
