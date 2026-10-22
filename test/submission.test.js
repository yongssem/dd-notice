import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithEsbuild } from 'vite';

test('disabled submit button renders the native disabled attribute', async () => {
  const source = await readFile(new URL('../src/components/ui/Button.jsx', import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(source, 'Button.jsx', { jsx: 'transform', jsxFactory: 'React.createElement', format: 'cjs' });
  const module = { exports: {} };
  new Function('React', 'module', 'exports', code)(React, module, module.exports);
  const html = renderToStaticMarkup(React.createElement(module.exports.default, { type: 'submit', disabled: true }, '저장 중'));
  assert.match(html, /disabled=""/);
  assert.match(html, /type="submit"/);
});

async function composer({ busy = false, save }) {
  const source = await readFile(new URL('../src/components/NoticeComposer.jsx', import.meta.url), 'utf8');
  const body = source.match(/const handleSubmit = async \(e\) => \{([\s\S]*?)\n  \};/)[1];
  const submitLock = { current: false }, cleared = [];
  const handler = new Function('busy', 'submitLock', 'date', 'content', 'onSubmit', 'isEdit', 'setContent', `return async e => {${body}}`)(busy, submitLock, '2026-10-23', '가상 알림', save, false, v => cleared.push(v));
  return { handler, cleared };
}
const event = { preventDefault() {} };
test('same-frame repeated submit waits for one write; successful new notice clears composer', async () => {
  let calls = 0, finish;
  const save = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const { handler, cleared } = await composer({ save });
  const pending = handler(event);
  await handler(event);
  assert.equal(calls, 1);
  finish(true); await pending;
  assert.deepEqual(cleared, ['']);
});
test('failed save preserves text and permits a later retry', async () => {
  let calls = 0;
  const { handler, cleared } = await composer({ save: async () => { calls++; return false; } });
  await handler(event); await handler(event);
  assert.equal(calls, 2);
  assert.deepEqual(cleared, []);
});
test('busy composer blocks Enter-driven form submit too', async () => {
  let calls = 0;
  const { handler } = await composer({ busy: true, save: async () => { calls++; return true; } });
  await handler(event);
  assert.equal(calls, 0);
});
