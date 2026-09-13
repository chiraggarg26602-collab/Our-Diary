import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signInAnonymously,
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  diaryId: string | null;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  authErrorCode: string | null;
  clearAuthError: () => void;
  login: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
            setLoading(false);
          } else {
            const newProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Guest',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              diaryId: null,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
          }
        }, (error) => {
          console.error("Profile sync error:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
    setAuthErrorCode(null);
  };

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      const code = error?.code || '';
      setAuthErrorCode(code);
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        // User closed the popup window or triggered a rapid click; not a fatal error
        console.warn('Google sign-in popup was cancelled or closed.');
      } else if (code === 'auth/popup-blocked') {
        const msg = 'Popup was blocked by your browser. Please allow popups or open in a new tab.';
        console.warn(msg);
        setAuthError(msg);
      } else if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        const msg = `This domain (${host}) is not in your Firebase Authorized Domains list.`;
        console.warn(msg, error);
        setAuthError(msg);
      } else {
        console.error('Login failed:', error);
        setAuthError(error?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginAsGuest = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('Guest login failed:', error);
      setAuthErrorCode(error?.code || 'auth/guest-failed');
      setAuthError(error?.message || 'Guest sign-in is not enabled in Firebase.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const updateProfileName = async (newName: string) => {
    if (!user || !newName.trim()) return;
    const trimmed = newName.trim();
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: trimmed,
        lastUpdated: serverTimestamp(),
      });
      setProfile((prev) => (prev ? { ...prev, name: trimmed } : null));
    } catch (err) {
      console.error('Failed to update name:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggingIn, authError, authErrorCode, clearAuthError, login, loginAsGuest, updateProfileName, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
