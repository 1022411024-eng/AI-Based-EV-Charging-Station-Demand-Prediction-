import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderKeyForEVIntelligence',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'urban-ev-demand.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'urban-ev-demand',
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'urban-ev-demand'}.appspot.com`,
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
