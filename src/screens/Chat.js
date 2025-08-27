import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import EmojiModal from 'react-native-emoji-modal';
import { Bubble, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
import MapView, { Marker } from 'react-native-maps';
import uuid from 'react-native-uuid';

import { colors } from '../config/constants';
import { auth, database } from '../config/firebase';
import StickerPicker from '../components/StickerPicker';

const RenderLoadingUpload = () => (
  <View style={styles.loadingContainerUpload}>
    <ActivityIndicator size="large" color={colors.teal} />
  </View>
);

const RenderLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.teal} />
  </View>
);

const RenderBubble = (props) => (
  <Bubble
    {...props}
    wrapperStyle={{
      right: { backgroundColor: colors.primary },
      left: { backgroundColor: 'lightgrey' },
    }}
  />
);

const RenderAttach = (props) => (
  <TouchableOpacity {...props} style={styles.addImageIcon}>
    <View>
      <Ionicons name="attach-outline" size={32} color={colors.teal} />
    </View>
  </TouchableOpacity>
);

const RenderInputToolbar = (
  props,
  handleEmojiPanel,
  handleStickerPanel,
  sendLocationOnce
) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      backgroundColor: 'white',
    }}
  >
    <InputToolbar
      {...props}
      renderActions={() =>
        RenderActions(handleEmojiPanel, handleStickerPanel, sendLocationOnce)
      }
      containerStyle={styles.inputToolbar}
    />
    <Send {...props}>
      <View style={styles.sendIconContainer}>
        <Ionicons name="send" size={24} color={colors.teal} />
      </View>
    </Send>
  </View>
);

const RenderActions = (handleEmojiPanel, handleStickerPanel, sendLocationOnce) => (
  <View style={styles.actionsContainer}>
    <TouchableOpacity style={styles.actionIcon} onPress={handleEmojiPanel}>
      <Ionicons name="happy-outline" size={32} color={colors.teal} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionIcon} onPress={handleStickerPanel}>
      <Ionicons name="images-outline" size={32} color={colors.teal} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionIcon} onPress={sendLocationOnce}>
      <Ionicons name="location-outline" size={32} color={colors.teal} />
    </TouchableOpacity>
  </View>
);

const openExternalMap = (lat, lng) => {
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  Linking.openURL(url);
};

const RenderCustomView = ({ currentMessage }) => {
  if (currentMessage.type === 'location') {
    return (
      <TouchableOpacity
        onPress={() => openExternalMap(currentMessage.lat, currentMessage.lng)}
      >
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentMessage.lat,
            longitude: currentMessage.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: currentMessage.lat,
              longitude: currentMessage.lng,
            }}
          />
        </MapView>
      </TouchableOpacity>
    );
  }
  if (currentMessage.type === 'sticker') {
    return (
      <Image
        source={{ uri: currentMessage.sticker }}
        style={styles.stickerImageMessage}
      />
    );
  }
  return null;
};

RenderCustomView.propTypes = {
  currentMessage: PropTypes.shape({
    type: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
    sticker: PropTypes.string,
  }).isRequired,
};

function Chat({ route }) {
  const [messages, setMessages] = useState([]);
  const [modal, setModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stickerModal, setStickerModal] = useState(false);
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(database, 'chats', route.params.id), (document) => {
      setMessages(
        document.data().messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toDate(),
          image: message.image ?? '',
          sticker: message.sticker ?? '',
          lat: message.lat ?? null,
          lng: message.lng ?? null,
          ts: message.ts?.toDate ? message.ts.toDate() : message.ts ?? null,
          type: message.type ?? 'text',
        }))
      );
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss();
      if (modal || stickerModal) {
        setModal(false);
        setStickerModal(false);
        return true;
      }
      return false;
    });

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (modal) setModal(false);
      if (stickerModal) setStickerModal(false);
    });

    return () => {
      unsubscribe();
      backHandler.remove();
      keyboardDidShowListener.remove();
    };
  }, [route.params.id, modal, stickerModal]);

  const onSend = useCallback(
    async (m = []) => {
      // Get messages
      const chatDocRef = doc(database, 'chats', route.params.id);
      const chatDocSnap = await getDoc(chatDocRef);

      const chatData = chatDocSnap.data();
      const data = chatData.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toDate(),
        image: message.image ?? '',
      }));

      // Attach new message
      const messagesWillSend = [{ ...m[0], sent: true, received: false }];
      const chatMessages = GiftedChat.append(data, messagesWillSend);

      setDoc(
        doc(database, 'chats', route.params.id),
        {
          messages: chatMessages,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    },
    [route.params.id]
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await uploadImageAsync(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    setUploading(true);
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const randomString = uuid.v4();
    const fileRef = ref(getStorage(), randomString);
    const uploadTask = uploadBytesResumable(fileRef, blob);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        // Handle unsuccessful uploads
        console.log(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setUploading(false);
        onSend([
          {
            _id: randomString,
            createdAt: new Date(),
            text: '',
            image: downloadUrl,
            user: {
              _id: auth?.currentUser?.email,
              name: auth?.currentUser?.displayName,
              avatar: 'https://i.pravatar.cc/300',
            },
          },
        ]);
      }
    );
  };

  const handleEmojiPanel = useCallback(() => {
    setModal((prevModal) => {
      if (prevModal) {
        Keyboard.dismiss();
        return false;
      }
      Keyboard.dismiss();
      setStickerModal(false);
      return true;
    });
  }, []);

  const handleStickerPanel = useCallback(() => {
    setStickerModal((prev) => {
      if (prev) {
        Keyboard.dismiss();
        return false;
      }
      Keyboard.dismiss();
      setModal(false);
      return true;
    });
  }, []);

  const sendLocationOnce = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({});
    onSend([
      {
        _id: uuid.v4(),
        createdAt: new Date(),
        text: '',
        type: 'location',
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        ts: serverTimestamp(),
        senderId: auth?.currentUser?.email,
        user: {
          _id: auth?.currentUser?.email,
          name: auth?.currentUser?.displayName,
          avatar: 'https://i.pravatar.cc/300',
        },
      },
    ]);
  }, [onSend]);

  return (
    <>
      {uploading && RenderLoadingUpload()}
      <GiftedChat
        messages={messages}
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        onSend={(messagesArr) => onSend(messagesArr)}
        imageStyle={{ height: 212, width: 212 }}
        messagesContainerStyle={{ backgroundColor: '#fff' }}
        textInputStyle={{ backgroundColor: '#fff', borderRadius: 20 }}
        user={{
          _id: auth?.currentUser?.email,
          name: auth?.currentUser?.displayName,
          avatar: 'https://i.pravatar.cc/300',
        }}
        renderBubble={(props) => RenderBubble(props)}
        renderSend={(props) => RenderAttach({ ...props, onPress: pickImage })}
        renderUsernameOnMessage
        renderAvatarOnTop
        renderInputToolbar={(props) =>
          RenderInputToolbar(
            props,
            handleEmojiPanel,
            handleStickerPanel,
            sendLocationOnce
          )
        }
        renderCustomView={RenderCustomView}
        minInputToolbarHeight={56}
        scrollToBottom
        scrollToBottomStyle={styles.scrollToBottomStyle}
        renderLoading={RenderLoading}
      />

      <StickerPicker
        visible={stickerModal}
        onSelect={(url) => {
          onSend([
            {
              _id: uuid.v4(),
              createdAt: new Date(),
              text: '',
              type: 'sticker',
              sticker: url,
              user: {
                _id: auth?.currentUser?.email,
                name: auth?.currentUser?.displayName,
                avatar: 'https://i.pravatar.cc/300',
              },
            },
          ]);
          setStickerModal(false);
        }}
      />

      {modal && (
        <EmojiModal
          onPressOutside={handleEmojiPanel}
          modalStyle={styles.emojiModal}
          containerStyle={styles.emojiContainerModal}
          backgroundStyle={styles.emojiBackgroundModal}
          columns={5}
          emojiSize={66}
          activeShortcutColor={colors.primary}
          onEmojiSelected={(emoji) => {
            onSend([
              {
                _id: uuid.v4(),
                createdAt: new Date(),
                text: emoji,
                user: {
                  _id: auth?.currentUser?.email,
                  name: auth?.currentUser?.displayName,
                  avatar: 'https://i.pravatar.cc/300',
                },
              },
            ]);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actionIcon: {
    borderRadius: 16,
    bottom: 8,
    height: 32,
    marginLeft: 4,
    width: 32,
  },
  actionsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  addImageIcon: {
    borderRadius: 16,
    bottom: 8,
    height: 32,
    width: 32,
  },
  emojiBackgroundModal: {},
  emojiContainerModal: {
    height: 348,
    width: 396,
  },
  emojiModal: {},
  inputToolbar: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: colors.grey,
    borderRadius: 22,
    borderWidth: 0.5,
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainerUpload: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999,
  },
  map: {
    borderRadius: 8,
    height: 160,
    width: 200,
  },
  scrollToBottomStyle: {
    borderColor: colors.grey,
    borderRadius: 28,
    borderWidth: 1,
    bottom: 12,
    height: 56,
    position: 'absolute',
    right: 12,
    width: 56,
  },
  sendIconContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: colors.grey,
    borderRadius: 22,
    borderWidth: 0.5,
    height: 44,
    justifyContent: 'center',
    marginRight: 8,
    width: 44,
  },
  stickerImageMessage: {
    height: 120,
    width: 120,
  },
});

Chat.propTypes = {
  route: PropTypes.object.isRequired,
};

export default Chat;
