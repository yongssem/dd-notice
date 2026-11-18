import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer as createViteServer } from 'vite';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import handler from '../api/parent.js';
import { getServerFirestore } from '../server/firestore.js';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8787');
assert.ok(process.env.PLAYWRIGHT_MODULE, 'Use the existing bundled Playwright module.');
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'demo-dd-notice-security';
delete process.env.GCP_PROJECT_ID;
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const tokenA = 'ui-token-a-00000000000000000000000';
const tokenB = 'ui-token-b-00000000000000000000000';
let env, vite, server, browser;
try {
  env = await initializeTestEnvironment({
    projectId: 'demo-dd-notice-security',
    firestore: { host: '127.0.0.1', port: 8787, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'classes/class-a'), { name: 'UI 가상 A반', teacherName: '가상교사', teacherUid: 'teacher-a' }),
      setDoc(doc(db, 'classes/class-b'), { name: 'UI 가상 B반', teacherName: '가상다른교사', teacherUid: 'teacher-b' }),
      ...[['parent-a','UI가상학생A',tokenA], ['parent-b','UI가상학생B',tokenB]].map(([id,studentName,inviteToken]) =>
        setDoc(doc(db, 'classes/class-a/parents/' + id), { studentName, inviteToken, parentNickname: '', tokenUsed: false, invitedAt: null, firstAccessAt: null, lastAccessAt: null })),
      setDoc(doc(db, 'classes/class-a/notices/notice-a'), { date: '2026-11-18', content: 'UI 가상공지', createdAt: null, updatedAt: null }),
    ]);
  });
  vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  server = createServer((req,res) => {
    if (req.url.split('?')[0] === '/api/parent') {
      Promise.resolve(handler(req,res)).catch(() => { res.statusCode = 500; res.end('{}'); });
    } else vite.middlewares(req,res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') { external.push(url.hostname); return route.abort(); }
    return route.continue();
  });
  await page.goto(base + '/p/class-a/' + tokenA);
  await page.getByRole('button', { name: '맞아요, 들어갈게요' }).waitFor();
  assert.equal(await page.locator('input[type=password]').count(), 0);
  assert.equal(await page.getByText('UI가상학생A', { exact: true }).count(), 1);
  await mkdir('.cache/screenshots', { recursive: true });
  await page.screenshot({ path: '.cache/screenshots/parent-first.png', fullPage: true });
  await page.getByRole('textbox').fill('UI 가상보호자A');
  await page.getByRole('button', { name: '맞아요, 들어갈게요' }).click();
  await page.getByText('UI 가상공지', { exact: true }).waitFor();
  await page.screenshot({ path: '.cache/screenshots/parent-open.png', fullPage: true });
  await page.reload();
  await page.getByText('UI 가상공지', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '맞아요, 들어갈게요' }).count(), 0);
  await page.goto(base + '/p/class-a/wrong-token-00000000000000000000');
  await page.getByRole('heading', { name: '접속 불가' }).waitFor();
  assert.equal((await page.locator('body').innerText()).includes('UI가상학생A'), false);
  await page.goto(base + '/p/class-b/' + tokenA);
  await page.getByRole('heading', { name: '접속 불가' }).waitFor();
  assert.equal((await page.locator('body').innerText()).includes('UI 가상 B반'), false);
  await page.goto(base + '/p/class-a/' + tokenB);
  await page.getByRole('button', { name: '맞아요, 들어갈게요' }).waitFor();
  const siblingBody = await page.locator('body').innerText();
  assert.match(siblingBody, /UI가상학생B/);
  assert.equal(siblingBody.includes('UI가상학생A'), false);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(JSON.stringify({ checks: ['existing-link-first-confirmation','same-button-opens-notices','reload-no-extra-action','wrong-token-denied','other-class-denied','sibling-own-confirmation-only','no-page-errors','no-external-page-requests'], pass: 8, screenshots: ['.cache/screenshots/parent-first.png','.cache/screenshots/parent-open.png'] }));
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await vite?.close();
  await env?.cleanup();
  await getServerFirestore().terminate();
}
