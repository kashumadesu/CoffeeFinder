// ============================================================
// Firebase Service — 100% Free Spark Tier (Auth & Firestore Sync)
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import type { OwnerClaimRequest } from '@types';

// Default free Spark project config or placeholder fallback
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderKeyForFreeSparkPlan',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'coffee-finder-ph-free.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'coffee-finder-ph-free',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'coffee-finder-ph-free.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.FIREBASE_APP_ID || '1:123456789012:web:demo123456',
};

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

// Firestore Database
const db = getFirestore(app);

export { app, auth, db };

// ---- Authentication Helpers (Free Spark Plan) ----

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return { user: cred.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Registration failed' };
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { user: cred.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Login failed' };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Sign out failed' };
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// ---- Cloud Firestore Claims & Verification Sync ----

const CLAIMS_COLLECTION = 'owner_claims';

/** Submit a new owner claim to Cloud Firestore */
export const submitClaimToFirestore = async (claim: OwnerClaimRequest) => {
  try {
    const claimDocRef = doc(db, CLAIMS_COLLECTION, claim.id);
    await setDoc(claimDocRef, {
      ...claim,
      createdAt: new Date().toISOString(),
    });
    return { success: true, error: null };
  } catch (err: any) {
    // If offline or free demo project, fallback gracefully
    return { success: false, error: err.message };
  }
};

/** Approve a claim in Cloud Firestore */
export const approveClaimInFirestore = async (claimId: string) => {
  try {
    const claimDocRef = doc(db, CLAIMS_COLLECTION, claimId);
    await updateDoc(claimDocRef, {
      status: 'verified',
      reviewedAt: new Date().toISOString(),
    });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/** Reject a claim in Cloud Firestore */
export const rejectClaimInFirestore = async (claimId: string, reason: string) => {
  try {
    const claimDocRef = doc(db, CLAIMS_COLLECTION, claimId);
    await updateDoc(claimDocRef, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
    });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/** Listen for real-time claim updates from Firestore across all devices */
export const subscribeToFirestoreClaims = (
  onClaimsUpdate: (claims: OwnerClaimRequest[]) => void,
) => {
  try {
    const q = query(collection(db, CLAIMS_COLLECTION), orderBy('submittedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const claims: OwnerClaimRequest[] = [];
        snapshot.forEach((doc) => {
          claims.push(doc.data() as OwnerClaimRequest);
        });
        if (claims.length > 0) {
          onClaimsUpdate(claims);
        }
      },
      () => {
        // Fallback silently if offline or demo project
      },
    );
  } catch {
    return () => {};
  }
};
