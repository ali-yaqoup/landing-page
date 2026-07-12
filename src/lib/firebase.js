import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDabzOP1wpIaTAFhfYGtBCxx_CwEJZcAS4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dataflow-project-23916.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dataflow-project-23916",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dataflow-project-23916.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "955284229345",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:955284229345:web:7d88d2321ceaf82894fba0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth, Firestore & Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// getMyBusiness Helper
export const getMyBusiness = async (userId) => {
  if (!userId) return null;
  
  // 1. Query businesses where userId == userId
  const busQ = query(collection(db, "businesses"), where("userId", "==", userId), limit(1));
  const busSnap = await getDocs(busQ).catch(() => null);
  if (busSnap && !busSnap.empty) {
    const d = busSnap.docs[0];
    return {
      id: d.id,
      name: d.data().name || "My Business",
      source: "businesses"
    };
  }
  
  // 2. Query projects where userId == userId
  const projQ = query(collection(db, "projects"), where("userId", "==", userId), limit(1));
  const projSnap = await getDocs(projQ).catch(() => null);
  if (projSnap && !projSnap.empty) {
    const d = projSnap.docs[0];
    return {
      id: d.id,
      name: d.data().name || "My Business",
      source: "projects"
    };
  }
  
  return null;
};
