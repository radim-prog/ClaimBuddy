'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getUserData } from '@/lib/firebase/auth';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user data from Firestore
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);

        // Set session cookie for middleware
        const token = await firebaseUser.getIdToken();
        document.cookie = `__session=${token}; path=/; max-age=3600; samesite=strict`;
      } else {
        setUserData(null);
        // Clear session cookie
        document.cookie = '__session=; path=/; max-age=0';
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
