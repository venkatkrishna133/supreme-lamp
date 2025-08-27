/* eslint-disable import/no-unresolved */
/* eslint-disable react/prop-types */
import * as SecureStore from 'expo-secure-store';
import { View, Button, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = 'notes';

const NoteEditor = ({ route, navigation }) => {
  const { id } = route.params || {};
  const [text, setText] = useState('');
  const [phrase, setPhrase] = useState('');
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const load = async () => {
      const json = await AsyncStorage.getItem(NOTES_KEY);
      const notes = json ? JSON.parse(json) : [];
      const note = notes.find((n) => n.id === id);
      if (note) setText(note.text);

      let stored = await SecureStore.getItemAsync('unlock_phrase');
      if (!stored) {
        stored = 'open sesame';
        await SecureStore.setItemAsync('unlock_phrase', stored);
      }
      setPhrase(stored);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (phrase && text.includes(phrase) && !triggered) {
      setTriggered(true);
      attemptUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, phrase, triggered]);

  const save = async () => {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    const notes = json ? JSON.parse(json) : [];
    const newNote = { id: id || Date.now().toString(), text };
    const index = notes.findIndex((n) => n.id === newNote.id);
    if (index > -1) {
      notes[index] = newNote;
    } else {
      notes.push(newNote);
    }
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    navigation.goBack();
  };

  const attemptUnlock = () => {
    navigation.navigate('Unlock');
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        multiline
        style={{ flex: 1, textAlignVertical: 'top' }}
        value={text}
        onChangeText={setText}
      />
      <Button title="Save" onPress={save} />
    </View>
  );
};

export default NoteEditor;
