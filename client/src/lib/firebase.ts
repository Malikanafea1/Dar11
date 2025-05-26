import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAcwXCNWt1bvWSbCmmJ1Fo0VEEDutnj6so",
  authDomain: "dar1-23.firebaseapp.com",
  projectId: "dar1-23",
  storageBucket: "dar1-23.firebasestorage.app",
  messagingSenderId: "1015752030247",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1015752030247:web:1fa3e73cfdaa129195f602",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;