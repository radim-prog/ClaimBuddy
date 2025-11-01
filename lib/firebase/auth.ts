'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './client';
import { USER_ROLES } from '@/lib/constants';
import type { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signUp(
  email: string,
  password: string,
  userData: { name: string; phone: string }
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Aktualizuj profil
    await updateProfile(user, {
      displayName: userData.name,
    });

    // Vytvoř dokument v Firestore
    const userDoc: Omit<User, 'id'> = {
      email: user.email!,
      name: userData.name,
      phone: userData.phone,
      role: USER_ROLES.CLIENT,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...userDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Pošli ověřovací email
    await sendEmailVerification(user);

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Zkontroluj jestli uživatel už existuje
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Vytvoř nového uživatele
      const newUser: Omit<User, 'id'> = {
        email: user.email!,
        name: user.displayName || '',
        phone: user.phoneNumber || '',
        role: USER_ROLES.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export async function getUserData(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
