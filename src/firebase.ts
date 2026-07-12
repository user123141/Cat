// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGFXPnVd26lxQOLR1tvWoMVvllpnwNkJY",
  authDomain: "cats-bef51.firebaseapp.com",
  projectId: "cats-bef51",
  storageBucket: "cats-bef51.firebasestorage.app",
  messagingSenderId: "92756540696",
  appId: "1:92756540696:web:329ea49721c7fc2cd3326d",
  measurementId: "G-NB44SSXZR1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log('✅ Firebase инициализирован с проектом cats-bef51');