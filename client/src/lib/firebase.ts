import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // يمكن تحديثه لاحقاً
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;