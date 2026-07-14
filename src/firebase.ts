// src/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  doc, 
  getDocFromServer, 
  enableNetwork, 
  disableNetwork,
  Firestore 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';
import { FirebaseLogger } from './utils/FirebaseLogger';

const firebaseConfig = {
  apiKey: "AIzaSyAGFXPnVd26lxQOLR1tvWoMVvllpnwNkJY",
  authDomain: "cats-bef51.firebaseapp.com",
  projectId: "cats-bef51",
  storageBucket: "cats-bef51.firebasestorage.app",
  messagingSenderId: "92756540696",
  appId: "1:92756540696:web:329ea49721c7fc2cd3326d",
  measurementId: "G-NB44SSXZR1"
};

let memoizedApp: FirebaseApp | null = null;
let memoizedDb: Firestore | null = null;
let memoizedAuth: Auth | null = null;
let isOfflineState = false;

// Factory function for memoized initialization
export const initializeFirebase = () => {
  if (!memoizedApp) {
    memoizedApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    memoizedDb = initializeFirestore(memoizedApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    memoizedAuth = getAuth(memoizedApp);
    FirebaseLogger.log('info', 'Firebase (Local persistent cache) initialized successfully');
  }
  return { app: memoizedApp, db: memoizedDb, auth: memoizedAuth };
};

// Initialize immediately and export instances for backwards compatibility
const firebaseInstance = initializeFirebase();
export const db = firebaseInstance.db;
export const auth = firebaseInstance.auth;

// Getter and Setter for the internal offline state
export const getOfflineStatus = () => isOfflineState;
export const setOfflineStatus = (status: boolean) => {
  isOfflineState = status;
};

// Connection health check utility to verify server reachability and manage Firestore network status
export const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    // If navigator says we are online, force Firestore network reconnection to prevent false-positives
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await enableNetwork(db);
    }
    
    // Explicitly bypass local cache to test server connectivity
    await getDocFromServer(doc(db, '_health_check_', 'ping'));
    isOfflineState = false;
    return true;
  } catch (err: any) {
    const errMessage = err?.message || '';
    const errCode = err?.code || '';
    
    // If it is a network failure or a "client is offline" issue
    const isNetworkErr = errCode === 'unavailable' || 
                         errCode === 'network-request-failed' || 
                         errMessage.includes('offline') || 
                         errMessage.includes('network') || 
                         errMessage.includes('client is offline');

    if (isNetworkErr) {
      isOfflineState = true;
      FirebaseLogger.log('warn', `Firestore is offline. Error: ${errMessage}`);
      // Disable network internally to prevent hanging re-sync loops
      try {
        await disableNetwork(db);
      } catch (disErr) {
        // Safe catch
      }
    } else {
      // Permission-denied or Document-not-found means the connection actually works (server responded!)
      isOfflineState = false;
      return true;
    }
    return false;
  }
};

// Returns UID (Firebase or local) 
export const initAuth = (): Promise<string> => {
  return new Promise((resolve) => {
    const localUid = localStorage.getItem('maccat_local_uid');
    if (localUid) {
      FirebaseLogger.log('info', `Используем локальный UID: ${localUid}`);
      resolve(localUid);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        FirebaseLogger.log('info', `Анонимный пользователь: ${user.uid}`);
        localStorage.setItem('maccat_local_uid', user.uid);
        resolve(user.uid);
        unsubscribe();
      } else {
        signInAnonymously(auth)
          .then((userCred) => {
            FirebaseLogger.log('info', `Анонимный вход выполнен: ${userCred.user.uid}`);
            localStorage.setItem('maccat_local_uid', userCred.user.uid);
            resolve(userCred.user.uid);
          })
          .catch((err) => {
            FirebaseLogger.log('warn', `Ошибка анонимной аутентификации: ${err.message}. Генерируем локальный ID.`);
            const newUid = 'local_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('maccat_local_uid', newUid);
            FirebaseLogger.log('info', `Сгенерирован локальный UID: ${newUid}`);
            resolve(newUid);
          });
        unsubscribe();
      }
    });
  });
};

console.log('✅ Firebase инициализирован с проектом cats-bef51 (Local persistent cache enabled)');
