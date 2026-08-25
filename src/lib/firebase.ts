// ===== Firebase App 및 Firestore 초기화 =====
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseConfig, type FirebaseConfig } from './firebaseConfig';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function initFirebase(customConfig?: FirebaseConfig): { app: FirebaseApp | null; db: Firestore | null } {
  const config = customConfig || getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null };
  }

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config);
    }
    firestoreDb = getFirestore(firebaseApp);
    return { app: firebaseApp, db: firestoreDb };
  } catch (error) {
    console.error('[Firebase] 초기화 실패:', error);
    return { app: null, db: null };
  }
}

export function getFirestoreDb(): Firestore | null {
  if (!firestoreDb) {
    const { db } = initFirebase();
    firestoreDb = db;
  }
  return firestoreDb;
}
