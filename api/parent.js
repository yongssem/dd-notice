import { FieldValue } from '@google-cloud/firestore';
import { getServerFirestore } from '../server/firestore.js';

const DENIED = { error: '요청을 처리할 수 없습니다.' };
const MAX_BODY_BYTES = 4096;
const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const tokenPattern = /^[A-Za-z0-9_-]{16,200}$/;

function fail(status) {
  throw Object.assign(new Error('Request rejected.'), { status });
}

async function readBody(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) fail(413);
    try { return JSON.parse(raw); } catch { fail(400); }
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > MAX_BODY_BYTES) fail(413);
    chunks.push(Buffer.from(chunk));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400); }
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400);
  const allowed = body.action === 'confirm'
    ? ['action', 'classId', 'token', 'nickname']
    : ['action', 'classId', 'token'];
  if (Object.keys(body).some(key => !allowed.includes(key))) fail(400);
  if (!['open', 'confirm'].includes(body.action)) fail(400);
  if (typeof body.classId !== 'string' || !idPattern.test(body.classId)) fail(400);
  if (typeof body.token !== 'string' || !tokenPattern.test(body.token)) fail(400);
  if (body.action === 'confirm'
    && (typeof body.nickname !== 'string' || !body.nickname.trim() || body.nickname.length > 20)) fail(400);
}

// The capability is checked inside the same transaction as every protected read/write.
async function visit(db, { action, classId, token, nickname }) {
  const classRef = db.collection('classes').doc(classId);
  return db.runTransaction(async transaction => {
    const matches = await transaction.get(classRef.collection('parents').where('inviteToken', '==', token).limit(2));
    if (matches.size !== 1) return null;
    const parentDoc = matches.docs[0];
    const parent = parentDoc.data();
    const classDoc = await transaction.get(classRef);
    if (!classDoc.exists) return null;
    const klass = classDoc.data();
    const firstConfirmation = action === 'confirm' && parent.tokenUsed !== true;
    const canReadNotices = parent.tokenUsed === true || firstConfirmation;
    let notices = [];
    if (canReadNotices) {
      const rows = await transaction.get(classRef.collection('notices').orderBy('date', 'desc'));
      const sorted = rows.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      sorted.sort((a, b) => a.date !== b.date
        ? (a.date < b.date ? 1 : -1)
        : (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      notices = sorted.map(({ id, date, content }) => ({ id, date, content }));
      transaction.update(parentDoc.ref, {
        lastAccessAt: FieldValue.serverTimestamp(),
        ...(firstConfirmation ? {
          parentNickname: nickname.trim(),
          tokenUsed: true,
          firstAccessAt: FieldValue.serverTimestamp(),
        } : {}),
      });
    }
    return {
      klass: { id: classId, name: klass.name, teacherName: klass.teacherName },
      parent: {
        id: parentDoc.id,
        studentName: parent.studentName,
        parentNickname: firstConfirmation ? nickname.trim() : parent.parentNickname,
        tokenUsed: canReadNotices,
      },
      notices,
    };
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      fail(405);
    }
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) fail(415);
    if (req.headers.origin) {
      let origin;
      try { origin = new URL(req.headers.origin); } catch { fail(403); }
      if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== req.headers.host) fail(403);
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') fail(403);
    const body = await readBody(req);
    validate(body);
    const result = await visit(getServerFirestore(), body);
    if (!result) fail(401);
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (error) {
    // Do not log invitation bodies, credentials, database errors, or student data.
    res.statusCode = [400, 401, 403, 405, 413, 415].includes(error.status) ? error.status : 503;
    res.end(JSON.stringify(DENIED));
  }
}
