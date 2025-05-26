import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBkJ8h9X2fR5vL3mN1pQ8wE7tY6uI4oP2s",
  authDomain: "dar1-23.firebaseapp.com",
  projectId: "dar1-23",
  storageBucket: "dar1-23.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abc123def456ghi789",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;