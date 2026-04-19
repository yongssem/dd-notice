import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

const randomToken = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `t_${Math.random().toString(36).slice(2)}_${Date.now()}`);

export async function getMyClass(uid) {
  if (!db || !uid) return null;
  const q = query(
    collection(db, 'classes'),
    where('teacherUid', '==', uid),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function createClass({ uid, name, teacherName }) {
  if (!db) throw new Error('Firestore 미초기화');
  const ref = await addDoc(collection(db, 'classes'), {
    name: name.trim(),
    teacherName: teacherName.trim(),
    teacherUid: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listStudents(classId) {
  if (!db || !classId) return [];
  const q = query(
    collection(db, 'classes', classId, 'parents'),
    orderBy('invitedAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addStudents(classId, names) {
  if (!db || !classId) throw new Error('Firestore 미초기화');
  const clean = names
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  if (clean.length === 0) return [];

  const batch = writeBatch(db);
  const created = [];
  for (const studentName of clean) {
    const parentRef = doc(collection(db, 'classes', classId, 'parents'));
    const payload = {
      studentName,
      inviteToken: randomToken(),
      tokenUsed: false,
      parentNickname: '',
      invitedAt: serverTimestamp(),
      firstAccessAt: null,
      lastAccessAt: null,
    };
    batch.set(parentRef, payload);
    created.push({ id: parentRef.id, ...payload });
  }
  await batch.commit();
  return created;
}

export async function regenerateToken(classId, parentId) {
  if (!db) throw new Error('Firestore 미초기화');
  const ref = doc(db, 'classes', classId, 'parents', parentId);
  await setDoc(
    ref,
    {
      inviteToken: randomToken(),
      tokenUsed: false,
      parentNickname: '',
      firstAccessAt: null,
    },
    { merge: true },
  );
}

export async function deleteStudent(classId, parentId) {
  if (!db) throw new Error('Firestore 미초기화');
  await deleteDoc(doc(db, 'classes', classId, 'parents', parentId));
}

export async function getClass(classId) {
  if (!db || !classId) return null;
  const snap = await getDoc(doc(db, 'classes', classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ───────── 알림장 (notices) ─────────

export async function listNotices(classId) {
  if (!db || !classId) return [];
  const q = query(
    collection(db, 'classes', classId, 'notices'),
    orderBy('date', 'desc'),
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // 같은 날짜끼리는 createdAt 최신순 (클라이언트 정렬로 복합 인덱스 회피)
  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return rows;
}

export async function createNotice(classId, { date, content }) {
  if (!db) throw new Error('Firestore 미초기화');
  const ref = await addDoc(collection(db, 'classes', classId, 'notices'), {
    date,
    content: content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNotice(classId, noticeId, { date, content }) {
  if (!db) throw new Error('Firestore 미초기화');
  await updateDoc(doc(db, 'classes', classId, 'notices', noticeId), {
    date,
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotice(classId, noticeId) {
  if (!db) throw new Error('Firestore 미초기화');
  await deleteDoc(doc(db, 'classes', classId, 'notices', noticeId));
}

// ───────── 학부모 진입 (inviteToken 기반) ─────────

export async function findParentByToken(classId, token) {
  if (!db || !classId || !token) return null;
  const q = query(
    collection(db, 'classes', classId, 'parents'),
    where('inviteToken', '==', token),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function markParentFirstAccess(classId, parentId, nickname) {
  if (!db) throw new Error('Firestore 미초기화');
  await updateDoc(doc(db, 'classes', classId, 'parents', parentId), {
    parentNickname: nickname.trim(),
    tokenUsed: true,
    firstAccessAt: serverTimestamp(),
    lastAccessAt: serverTimestamp(),
  });
}

export async function markParentReaccess(classId, parentId) {
  if (!db) throw new Error('Firestore 미초기화');
  await updateDoc(doc(db, 'classes', classId, 'parents', parentId), {
    lastAccessAt: serverTimestamp(),
  });
}
