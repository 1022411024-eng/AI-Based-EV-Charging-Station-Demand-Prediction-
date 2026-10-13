import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firestoreDb: Firestore | null = null;
let isConfigured = false;

try {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountRaw) {
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch {
      // If service account is a file path instead of raw JSON string
      serviceAccount = serviceAccountRaw;
    }

    const app: App = !getApps().length
      ? initializeApp({
          credential: cert(serviceAccount),
        })
      : getApps()[0];

    firestoreDb = getFirestore(app);
    isConfigured = true;
    console.log('Firebase Admin SDK initialized successfully with Firestore.');
  } else {
    console.log('FIREBASE_SERVICE_ACCOUNT not configured; operating in local storage mode.');
  }
} catch (error: any) {
  console.warn('Firebase Admin initialization notice:', error?.message || error);
  firestoreDb = null;
  isConfigured = false;
}

export const db = firestoreDb;
export const isFirebaseConfigured = () => isConfigured && firestoreDb !== null;
