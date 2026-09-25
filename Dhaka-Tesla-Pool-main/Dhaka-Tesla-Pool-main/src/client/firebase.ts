import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
// CRITICAL: The app requires the explicit database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Error handling conforming to firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per skill requirement
export async function testFirestoreConnection(): Promise<boolean> {
  const testPath = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is disconnected.');
    }
    // Expected on initial boot if test/connection doesn't exist yet, non-fatal
    return false;
  }
}

// Google Sign-In helper
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

// Sign-Out helper
export async function signOutFirebase() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out error:', error);
  }
}

// Firestore Persistence Helpers
export async function syncUserProfileToFirestore(user: {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  role: string;
  phone?: string;
}) {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL || '',
        role: user.role,
        phone: user.phone || '+880 1700-000000',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistRideToFirestore(ride: any) {
  if (!ride || !ride.id) return;
  const path = `rides/${ride.id}`;
  try {
    await setDoc(
      doc(db, 'rides', ride.id),
      {
        id: ride.id,
        passengerId: ride.passengerId,
        passengerName: ride.passenger?.name || '',
        pickupArea: ride.pickupArea,
        destinationArea: ride.destinationArea,
        seatsRequested: ride.seatsRequested || 1,
        fare: ride.fare,
        formattedFare: ride.formattedFare || '',
        status: ride.status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // If not authenticated in firebase yet, ignore or handle gracefully
    console.warn('Could not persist ride to firestore:', error);
  }
}

export async function saveGroundedPlaceToFirestore(
  userId: string,
  place: { title: string; uri: string; address?: string; snippet?: string; area?: string }
) {
  const placeId = `place_${Date.now()}`;
  const path = `users/${userId}/saved_places/${placeId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'saved_places', placeId), {
      id: placeId,
      userId,
      title: place.title,
      uri: place.uri,
      address: place.address || '',
      snippet: place.snippet || '',
      area: place.area || 'Dhaka',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
