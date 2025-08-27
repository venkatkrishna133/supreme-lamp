/* eslint-disable import/no-unresolved */
/* eslint-disable react/prop-types */
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, Button, FlatList, TouchableOpacity } from 'react-native';
import React, { useRef, useState, useEffect, useContext, useLayoutEffect } from 'react';

import { UnlockContext } from '../contexts/UnlockContext';

const NOTES_KEY = 'notes';

const NotesList = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const { setUnlocked } = useContext(UnlockContext);
  const tapCount = useRef(0);
  const timer = useRef(null);

  const loadNotes = async () => {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    setNotes(json ? JSON.parse(json) : []);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadNotes);
    return unsubscribe;
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity onPress={handleHeaderTap}>
          <Text>Notes</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <Button title="Add" onPress={() => navigation.navigate('NoteEditor')} />
      ),
    });
  });

  const handleHeaderTap = () => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      timer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 3000);
    }
    if (tapCount.current >= 5) {
      if (timer.current) clearTimeout(timer.current);
      tapCount.current = 0;
      attemptUnlock();
    }
  };

  const attemptUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync();
    if (result.success) {
      setUnlocked(true);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{ padding: 16, borderBottomWidth: 1, borderColor: '#ddd' }}
      onPress={() => navigation.navigate('NoteEditor', { id: item.id })}
    >
      <Text numberOfLines={1}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No notes</Text>}
      />
    </View>
  );
};

export default NotesList;
