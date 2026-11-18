import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8787', 'Run against the isolated local emulator only.');
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dd-notice-security',
    firestore: { host: '127.0.0.1', port: 8787, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'classes/class-a'), { name: '가상 A반', teacherName: '가상 교사 A', teacherUid: 'teacher-a' }),
      setDoc(doc(db, 'classes/class-b'), { name: '가상 B반', teacherName: '가상 교사 B', teacherUid: 'teacher-b' }),
      setDoc(doc(db, 'classes/class-a/parents/parent-a'), { studentName: '가상학생A', inviteToken: 'token-a-00000000000000000000000000', parentNickname: '', tokenUsed: false, invitedAt: null, firstAccessAt: null, lastAccessAt: null }),
      setDoc(doc(db, 'classes/class-a/parents/parent-b'), { studentName: '가상학생B', inviteToken: 'token-b-00000000000000000000000000', parentNickname: '', tokenUsed: false, invitedAt: null, firstAccessAt: null, lastAccessAt: null }),
      setDoc(doc(db, 'classes/class-a/notices/notice-a'), { date: '2026-11-18', content: '가상 공지', createdAt: null, updatedAt: null }),
    ]);
  });
});

test('unauthenticated callers cannot list student names or invitation tokens', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDocs(collection(db, 'classes/class-a/parents')));
});
test('knowing a parent document path does not grant read access', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'classes/class-a/parents/parent-a')));
});
test('unauthenticated callers cannot change another parent nickname or access state', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(updateDoc(doc(db, 'classes/class-a/parents/parent-b'), { parentNickname: '변경시도', tokenUsed: true }));
});
test('class identifiers do not grant unauthenticated access to class or notices', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'classes/class-a')));
  await assertFails(getDocs(collection(db, 'classes/class-a/notices')));
});
test('a different teacher cannot read another class, student, or notice', async () => {
  const db = env.authenticatedContext('teacher-b').firestore();
  await assertFails(getDoc(doc(db, 'classes/class-a')));
  await assertFails(getDocs(collection(db, 'classes/class-a/parents')));
  await assertFails(getDoc(doc(db, 'classes/class-a/notices/notice-a')));
});
test('the owning teacher can keep managing their class and student invitations', async () => {
  const db = env.authenticatedContext('teacher-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'classes/class-a')));
  await assertSucceeds(getDocs(collection(db, 'classes/class-a/parents')));
  await assertSucceeds(updateDoc(doc(db, 'classes/class-a/parents/parent-a'), { inviteToken: 'replacement-token', tokenUsed: false }));
  await assertSucceeds(deleteDoc(doc(db, 'classes/class-a/parents/parent-b')));
  await assertSucceeds(setDoc(doc(db, 'classes/class-a/notices/new-notice'), { date: '2026-11-19', content: '가상 새 공지' }));
});
test('a teacher cannot transfer class ownership through an update', async () => {
  const db = env.authenticatedContext('teacher-a').firestore();
  await assertFails(updateDoc(doc(db, 'classes/class-a'), { teacherUid: 'teacher-b' }));
});
