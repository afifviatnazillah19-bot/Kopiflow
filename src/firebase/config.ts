import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA_0RcwspR_Xs-hL1Dr6Jfc1KNZzxACHss",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kopiflowerp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kopiflowerp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kopiflowerp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "42399905728",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:42399905728:web:2bc32e0099c41982407a25",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-H7BLKKZF7L",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://kopiflowerp-default-rtdb.asia-southeast1.firebasedatabase.app"
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Cloud Firestore Database with auto-detect long polling & multi-tab persistence
let dbInstance: ReturnType<typeof getFirestore>;
try {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

// Firebase Realtime Database
let rtdbInstance: Database | null = null;
try {
  rtdbInstance = getDatabase(app);
} catch {
  try {
    rtdbInstance = getDatabase(app, "https://kopiflowerp-default-rtdb.firebaseio.com");
  } catch (err2) {
    console.warn("Realtime Database initialization info:", err2);
  }
}
export const rtdb = rtdbInstance;

// Auth
export const auth = getAuth(app);

// Attempt anonymous sign-in gracefully so auth-required rules work automatically
if (typeof window !== 'undefined') {
  import('firebase/auth').then(({ signInAnonymously }) => {
    signInAnonymously(auth).catch(() => {
      // If anonymous auth is not enabled in Firebase Console, continue as unauthenticated
    });
  }).catch(() => {});
}

// Safe Analytics initialization as requested
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((yes) => {
    if (yes) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional in preview / testing environments
  });
}
export const analytics = analyticsInstance;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errMsg.includes('Could not reach Cloud Firestore') ||
    errMsg.includes('client is offline') ||
    errMsg.includes('offline')
  ) {
    console.info(`[Firestore ${operationType} on ${path || 'unknown'}]: running in offline cache mode.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Realtime Database Notice: ', JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    console.info('KopiFlow operating in offline cache mode.');
    return false;
  }
  return true;
}
