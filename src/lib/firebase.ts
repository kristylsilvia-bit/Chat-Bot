import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Use environment variables for better production support (e.g. Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Fallback to JSON config if env vars are missing (for local AI Studio environment)
let finalConfig = { ...firebaseConfig };

// Use import.meta.glob to optionally load the config file without breaking the build if it's missing
const configFiles = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const configData = Object.values(configFiles)[0] as any;

if (!finalConfig.apiKey && configData) {
  finalConfig = {
    ...finalConfig,
    ...(configData.default || configData)
  };
}

if (!finalConfig.apiKey) {
  console.warn("Firebase configuration missing. Please set environment variables (VITE_FIREBASE_*) or ensure firebase-applet-config.json exists.");
}

const app = initializeApp(finalConfig);
export const auth = getAuth(app);

// Handle named databases if provided, otherwise default
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || (finalConfig as any).firestoreDatabaseId || "(default)";
export const db = getFirestore(app, databaseId);

export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Connection test to help diagnose configuration issues
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc just to check connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase Connection Error: The client is offline. This usually means your Firebase configuration (API Key, Project ID, or Database ID) is incorrect or the domain is not authorized.");
    }
  }
}

testConnection();

export { onAuthStateChanged };
export type { User };
