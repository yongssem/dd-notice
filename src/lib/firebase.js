import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// authDomain이 비면 initializeApp은 성공하지만 Google 팝업 로그인이 실패합니다.
// 그래서 필수 키에 포함해 "설정 대기 중" 화면에서 미리 잡아 줍니다.
const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];

/** 비어 있는 필수 환경변수 이름 목록 (예: ['VITE_FIREBASE_API_KEY']) */
export const missingFirebaseEnvKeys = REQUIRED_KEYS.filter(
  (k) => !firebaseConfig[k],
).map((k) => `VITE_FIREBASE_${k.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`);

export const firebaseConfigReady = missingFirebaseEnvKeys.length === 0;

export const app = firebaseConfigReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
