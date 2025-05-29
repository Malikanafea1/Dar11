import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcwXCNWt1bvWSbCmmJ1Fo0VEEDutnj6so",
  authDomain: "dar1-23.firebaseapp.com",
  projectId: "dar1-23",
  storageBucket: "dar1-23.firebasestorage.app",
  messagingSenderId: "1015752030247",
  appId: "1:1015752030247:web:1fa3e73cfdaa129195f602",
};

// تهيئة Firebase للخادم
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const db = getFirestore(app);

export default app;