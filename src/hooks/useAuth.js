import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfigReady } from '../lib/firebase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase 설정이 비어 있습니다. .env.local을 확인하세요.');
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase 설정이 비어 있습니다. .env.local을 확인하세요.');
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase 설정이 비어 있습니다. .env.local을 확인하세요.');
    return signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    return signOut(auth);
  }, []);

  return {
    user,
    loading,
    ready: firebaseConfigReady,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
  };
}
