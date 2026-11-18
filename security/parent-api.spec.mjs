import { after, afterEach, before, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getServerFirestore } from '../server/firestore.js';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8787');
process.env.FIREBASE_PROJECT_ID = 'demo-dd-notice-security';
process.env.NODE_ENV = 'test';
const A = 'token-a-00000000000000000000000000';
const B = 'token-b-00000000000000000000000000';
const C = 'token-c-00000000000000000000000000';
let env, server, base, handler;
afterEach(() => mock.restoreAll());
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dd-notice-security',
    firestore: { host: '127.0.0.1', port: 8787, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  try { handler = (await import('../api/parent.js')).default; }
  catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND' || !error.url?.endsWith('/api/parent.js')) throw error;
    // A missing endpoint behaves as 404 so the desired HTTP contract fails before implementation.
    handler = (_req, res) => { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{}'); };
  }
  server = createServer((req, res) => { Promise.resolve(handler(req, res)).catch(() => { res.statusCode = 500; res.end('{}'); }); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'classes/class-a'), { name: '가상 A반', teacherName: '가상교사 A', teacherUid: 'teacher-a' }),
      setDoc(doc(db, 'classes/class-b'), { name: '가상 B반', teacherName: '가상교사 B', teacherUid: 'teacher-b' }),
      ...[['class-a','parent-a','가상학생A',A], ['class-a','parent-b','가상학생B',B], ['class-b','parent-c','가상학생C',C]].map(([klass,id,name,token]) =>
        setDoc(doc(db, 'classes/' + klass + '/parents/' + id), { studentName: name, inviteToken: token, parentNickname: '', tokenUsed: false, invitedAt: null, firstAccessAt: null, lastAccessAt: null })),
      setDoc(doc(db, 'classes/class-a/notices/notice-a'), { date: '2026-11-18', content: 'A반 가상공지', createdAt: null, updatedAt: null }),
      setDoc(doc(db, 'classes/class-b/notices/notice-b'), { date: '2026-11-18', content: 'B반 가상공지', createdAt: null, updatedAt: null }),
    ]);
  });
});
async function request(payload, options = {}) {
  const response = await fetch(base + '/api/parent', {
    method: options.method || 'POST',
    headers: { 'content-type': options.type || 'application/json', origin: options.origin || base },
    ...(options.method === 'GET' ? {} : { body: options.raw ?? JSON.stringify(payload) }),
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
const openA = { action: 'open', classId: 'class-a', token: A };
const confirmA = { action: 'confirm', classId: 'class-a', token: A, nickname: '가상A 보호자' };

test('an existing valid invitation opens the same student confirmation without exposing tokens', async () => {
  const result = await request(openA);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { klass: { id: 'class-a', name: '가상 A반', teacherName: '가상교사 A' }, parent: { id: 'parent-a', studentName: '가상학생A', parentNickname: '', tokenUsed: false }, notices: [] });
  assert.match(result.headers.get('cache-control'), /no-store/);
  assert.equal(JSON.stringify(result.body).includes(A), false);
  assert.equal(JSON.stringify(result.body).includes(B), false);
  assert.equal(JSON.stringify(result.body).includes('teacher-a'), false);
});
test('the existing first confirmation records its parent and returns only its class notices', async () => {
  const result = await request(confirmA);
  assert.equal(result.status, 200);
  assert.equal(result.body.parent.parentNickname, '가상A 보호자');
  assert.equal(result.body.parent.tokenUsed, true);
  assert.deepEqual(result.body.notices, [{ id: 'notice-a', date: '2026-11-18', content: 'A반 가상공지' }]);
  await env.withSecurityRulesDisabled(async context => {
    const data = (await getDoc(doc(context.firestore(), 'classes/class-a/parents/parent-a'))).data();
    assert.equal(data.parentNickname, '가상A 보호자');
    assert.ok(data.firstAccessAt?.toMillis() > 0);
    assert.ok(data.lastAccessAt?.toMillis() > 0);
  });
});
test('returning through the same link needs no new login or confirmation and keeps the first nickname', async () => {
  await request(confirmA);
  const repeatedConfirm = await request({ ...confirmA, nickname: '덮어쓰기시도' });
  assert.equal(repeatedConfirm.status, 200);
  assert.equal(repeatedConfirm.body.parent.parentNickname, '가상A 보호자');
  const returning = await request(openA);
  assert.equal(returning.status, 200);
  assert.equal(returning.body.parent.tokenUsed, true);
  assert.equal(returning.body.notices[0].content, 'A반 가상공지');
});
test('wrong tokens, class-token mismatches and unknown classes return the same generic denial', async () => {
  const wrong = await request({ ...openA, token: C });
  const otherClass = await request({ ...openA, classId: 'class-b' });
  const missing = await request({ ...openA, classId: 'missing-class' });
  assert.equal(wrong.status, 401);
  assert.equal(otherClass.status, 401);
  assert.equal(missing.status, 401);
  assert.deepEqual(wrong.body, otherClass.body);
  assert.deepEqual(wrong.body, missing.body);
  assert.equal(JSON.stringify(wrong.body).includes(C), false);
});
test('a valid sibling invitation returns that sibling only, never another parent record', async () => {
  const result = await request({ ...openA, token: B });
  assert.equal(result.status, 200);
  assert.equal(result.body.parent.id, 'parent-b');
  assert.equal(result.body.parent.studentName, '가상학생B');
  assert.equal(JSON.stringify(result.body).includes('가상학생A'), false);
});
test('a forged parentId cannot direct confirmation writes into a sibling record', async () => {
  const result = await request({ ...confirmA, parentId: 'parent-b' });
  assert.equal(result.status, 400);
  await env.withSecurityRulesDisabled(async context => {
    const data = (await getDoc(doc(context.firestore(), 'classes/class-a/parents/parent-b'))).data();
    assert.equal(data.tokenUsed, false);
    assert.equal(data.parentNickname, '');
  });
});
test('link reissue immediately revokes the old capability even after a successful visit', async () => {
  await request(confirmA);
  await env.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'classes/class-a/parents/parent-a'), { inviteToken: 'replacement-000000000000000000000000' });
  });
  assert.equal((await request(openA)).status, 401);
});
test('deleting a student revokes the existing invitation without a migration', async () => {
  await env.withSecurityRulesDisabled(async context => { await deleteDoc(doc(context.firestore(), 'classes/class-a/parents/parent-a')); });
  assert.equal((await request(openA)).status, 401);
});
test('GET, non-JSON, malformed JSON and unknown actions cannot access or write records', async () => {
  assert.equal((await request(openA, { method: 'GET' })).status, 405);
  assert.equal((await request(openA, { type: 'text/plain' })).status, 415);
  assert.equal((await request(null, { raw: '{bad json' })).status, 400);
  assert.equal((await request({ ...openA, action: 'delete' })).status, 400);
});
test('path injection, empty credentials, excessive body and invalid nicknames are rejected', async () => {
  assert.equal((await request({ ...openA, classId: '../class-b' })).status, 400);
  assert.equal((await request({ ...openA, token: '' })).status, 400);
  assert.equal((await request({ ...openA, unused: 'x'.repeat(5000) })).status, 413);
  assert.equal((await request({ ...confirmA, nickname: ' ' })).status, 400);
  assert.equal((await request({ ...confirmA, nickname: 'x'.repeat(21) })).status, 400);
});
test('cross-origin requests cannot use the capability endpoint', async () => {
  assert.equal((await request(openA, { origin: 'https://other.example' })).status, 403);
});

test('duplicate invitation tokens in one class fail closed without exposing either student', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'classes/class-a/parents/parent-b'), { inviteToken: A });
  });
  const result = await request(openA);
  assert.equal(result.status, 401);
  assert.deepEqual(Object.keys(result.body), ['error']);
  assert.equal(JSON.stringify(result.body).includes('가상학생'), false);
});
for (const mutation of ['rotate', 'delete']) {
  test('transaction callback retries revalidate a token after ' + mutation, async () => {
    const db = getServerFirestore();
    const original = db.runTransaction.bind(db);
    // Exercise a retry at the external SDK boundary using real transactions and stored data.
    mock.method(db, 'runTransaction', async updateFunction => {
      await original(updateFunction);
      await env.withSecurityRulesDisabled(async context => {
        const ref = doc(context.firestore(), 'classes/class-a/parents/parent-a');
        if (mutation === 'rotate') await updateDoc(ref, { inviteToken: 'rotated-0000000000000000000000000' });
        else await deleteDoc(ref);
      });
      return original(updateFunction);
    });
    const result = await request(openA);
    assert.equal(result.status, 401);
    assert.deepEqual(Object.keys(result.body), ['error']);
  });
}
test('database failures return a generic 503 and never log the synthetic secret or student data', async () => {
  const syntheticSecret = 'SYNTHETIC-SECRET-MUST-NOT-LEAK';
  const logs = [];
  for (const method of ['error', 'warn', 'log']) mock.method(console, method, (...args) => logs.push(args.join(' ')));
  mock.method(getServerFirestore(), 'runTransaction', async () => { throw new Error(syntheticSecret); });
  const result = await request(openA);
  assert.equal(result.status, 503);
  assert.deepEqual(Object.keys(result.body), ['error']);
  assert.equal(JSON.stringify(result.body).includes(syntheticSecret), false);
  assert.equal(JSON.stringify(result.body).includes(A), false);
  assert.deepEqual(logs, []);
});

test('the Vercel parsed JSON body contract follows the same protected invitation flow', async () => {
  const req = { method: 'POST', headers: { 'content-type': 'application/json', host: 'local.test', origin: 'http://local.test' }, body: openA };
  const res = { headers: {}, setHeader(key,value) { this.headers[key] = value; }, end(raw) { this.raw = raw; } };
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.raw).parent.id, 'parent-a');
  assert.match(res.headers['Cache-Control'], /no-store/);
});
