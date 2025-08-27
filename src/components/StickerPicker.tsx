import React, { useEffect, useState } from 'react';
import { FlatList, Image, TouchableOpacity, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { collection, getDocs } from 'firebase/firestore';

import { database } from '../config/firebase';

const StickerPicker = ({ visible, onSelect }) => {
  const [stickers, setStickers] = useState([]);

  useEffect(() => {
    if (!visible) return;
    const fetchStickers = async () => {
      const snapshot = await getDocs(
        collection(database, 'stickers', 'default', 'items')
      );
      setStickers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchStickers();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={stickers}
        numColumns={4}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              onSelect(item.imageURL);
            }}
          >
            <Image source={{ uri: item.imageURL }} style={styles.image} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    bottom: 0,
    height: 200,
    left: 0,
    padding: 8,
    position: 'absolute',
    right: 0,
  },
  image: {
    height: 80,
    margin: 4,
    width: 80,
  },
});

StickerPicker.propTypes = {
  visible: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default StickerPicker;

