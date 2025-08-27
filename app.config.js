import 'dotenv/config';
import process from 'process';

export default {
  expo: {
    name: 'react-native-chat',
    slug: 'react-native-chat',
    version: '1.0.0',
    orientation: 'portrait',
    icon: 'src/assets/icon.png',
    userInterfaceStyle: 'light',
    entryPoint: './src/App.js',
    splash: {
      image: 'src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: 'src/assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.ctere1.reactnativechat',
    },
    web: {
      favicon: 'src/assets/favicon.png',
    },
    newArchEnabled: true,
    extra: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      stunServer: process.env.STUN_SERVER,
      turnServer: process.env.TURN_URL,
      turnUsername: process.env.TURN_USERNAME,
      turnPassword: process.env.TURN_PASSWORD,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
