import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, NativeModules } from 'react-native';
import {
  RTCView,
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

import { colors } from '../config/constants';
import iceServers from '../lib/webrtc/ice';
import { addCandidate, callRef } from '../lib/webrtc/signaling';
import { auth } from '../config/firebase';

interface CallScreenProps {
  navigation: any;
  route: { params: { callId: string; remote: string; isCaller: boolean } };
}

const CallScreen = ({ navigation, route }: CallScreenProps) => {
  const { callId, remote, isCaller } = route.params;
  const pc = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    pc.current = new RTCPeerConnection({ iceServers });
    const start = async () => {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' },
      });
      stream.getTracks().forEach((t) => pc.current?.addTrack(t, stream));
      setLocalStream(stream);

      pc.current!.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.current!.onicecandidate = (event) => {
        if (event.candidate) {
          addCandidate(callId, isCaller ? 'A' : 'B', event.candidate.toJSON());
        }
      };

      const currentCall = callRef(callId);
      if (isCaller) {
        const offer = await pc.current!.createOffer();
        await pc.current!.setLocalDescription(offer);
        await setDoc(currentCall, {
          from: auth.currentUser?.email,
          to: remote,
          type: 'offer',
          offer,
          createdAt: serverTimestamp(),
        });

        onSnapshot(currentCall, (snapshot) => {
          const data = snapshot.data();
          if (data?.answer && !pc.current!.currentRemoteDescription) {
            pc.current!.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        onSnapshot(collection(currentCall, 'candidates_B'), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.current!.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
      } else {
        onSnapshot(currentCall, async (snapshot) => {
          const data = snapshot.data();
          if (data?.offer && !pc.current!.currentRemoteDescription) {
            await pc.current!.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.current!.createAnswer();
            await pc.current!.setLocalDescription(answer);
            await setDoc(currentCall, { answer }, { merge: true });
          }
        });

        onSnapshot(collection(currentCall, 'candidates_A'), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.current!.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
      }
    };

    start();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      pc.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const { ForegroundService } = NativeModules as {
        ForegroundService?: { startService: () => void; stopService: () => void };
      };
      ForegroundService?.startService();
      return () => {
        ForegroundService?.stopService();
      };
    }
    return undefined;
  }, []);

  const toggleMic = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  };

  const toggleCamera = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOff(!track.enabled);
    }
  };

  const flipCamera = () => {
    const track: any = localStream?.getVideoTracks()[0];
    track?.switchCamera?.();
  };

  const hangUp = () => {
    pc.current?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {remoteStream && (
        <RTCView style={styles.remoteVideo} streamURL={remoteStream.toURL()} objectFit="cover" />
      )}
      {localStream && (
        <RTCView style={styles.localVideo} streamURL={localStream.toURL()} objectFit="cover" />
      )}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMic} style={styles.controlButton}>
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCamera} style={styles.controlButton}>
          <Ionicons name={cameraOff ? 'videocam-off' : 'videocam'} size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={flipCamera} style={styles.controlButton}>
          <Ionicons name="camera-reverse" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={hangUp} style={[styles.controlButton, styles.hangup]}>
          <Ionicons name="call" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  remoteVideo: { flex: 1 },
  localVideo: {
    width: 120,
    height: 160,
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'black',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: colors.teal,
    marginHorizontal: 8,
  },
  hangup: {
    backgroundColor: colors.red,
  },
});

export default CallScreen;
