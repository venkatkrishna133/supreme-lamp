import Constants from 'expo-constants';

const { stunServer, turnServer, turnUsername, turnCredential } = Constants.expoConfig?.extra || {};

export const iceServers = [
  stunServer ? { urls: stunServer } : { urls: 'stun:stun.l.google.com:19302' },
  turnServer
    ? {
        urls: turnServer,
        username: turnUsername,
        credential: turnCredential,
      }
    : null,
].filter(Boolean);

export default iceServers;
