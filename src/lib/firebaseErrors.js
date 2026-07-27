// Firebase 에러를 교사가 바로 조치할 수 있는 한국어 안내로 변환합니다.
//
// ⚠️ "로그인이 안 된다"는 신고의 상당수는 실제로는 Auth 문제가 아닙니다.
// 로그인 자체는 성공했는데 곧바로 이어지는 Firestore 조회가 보안 규칙에 막혀
// 대시보드로 넘어가지 못하는 경우가 대부분입니다.
// Firebase 콘솔에서 "테스트 모드"로 Firestore를 시작하면
// `allow read, write: if request.time < timestamp.date(...)` 규칙이 깔리고
// 30일 뒤 만료되어 모든 읽기/쓰기가 permission-denied가 됩니다.
// 그래서 permission-denied는 별도로 짚어 줍니다.

const RULES_HINT =
  '이 저장소의 firestore.rules가 아직 배포되지 않았을 수 있습니다. ' +
  '터미널에서 `npx firebase deploy --only firestore:rules` 를 실행해 주세요. ' +
  '(Firebase 콘솔에서 "테스트 모드"로 시작했다면 규칙이 30일 뒤 만료됩니다.)';

const ENV_HINT =
  '.env.local(또는 Vercel 환경변수)의 VITE_FIREBASE_* 값을 확인하고 다시 배포/재시작해 주세요.';

const DOMAIN_HINT =
  'Firebase 콘솔 → Authentication → Settings → 승인된 도메인(Authorized domains)에 ' +
  '지금 접속 중인 주소를 추가해 주세요.';

// 코드 → [사용자 메시지, 조치 힌트]
const MESSAGES = {
  // ───────── Auth: 사용자가 고칠 수 있는 입력 문제 ─────────
  'auth/invalid-credential': ['이메일 또는 비밀번호가 맞지 않습니다.', ''],
  'auth/wrong-password': ['이메일 또는 비밀번호가 맞지 않습니다.', ''],
  'auth/user-not-found': ['등록되지 않은 이메일입니다.', ''],
  'auth/invalid-email': ['이메일 형식이 올바르지 않습니다.', ''],
  'auth/email-already-in-use': ['이미 가입된 이메일입니다.', ''],
  'auth/weak-password': ['비밀번호는 6자 이상이어야 합니다.', ''],
  'auth/popup-closed-by-user': ['로그인 창이 닫혔습니다.', ''],
  'auth/cancelled-popup-request': ['로그인 창이 닫혔습니다. 다시 시도해 주세요.', ''],
  'auth/user-disabled': ['사용 중지된 계정입니다.', ''],
  'auth/too-many-requests': ['시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.', ''],
  'auth/network-request-failed': ['네트워크를 확인해 주세요.', ''],
  'auth/popup-blocked': [
    '브라우저가 로그인 팝업을 차단했습니다.',
    '주소창의 팝업 차단을 해제한 뒤 다시 시도해 주세요.',
  ],

  // ───────── Auth: 설정/만료 문제 (비밀번호를 고쳐도 해결 안 됨) ─────────
  'auth/unauthorized-domain': ['Firebase에 등록되지 않은 도메인에서 접속했습니다.', DOMAIN_HINT],
  'auth/operation-not-allowed': [
    '이 로그인 방식이 꺼져 있습니다.',
    'Firebase 콘솔 → Authentication → Sign-in method 에서 이메일/비밀번호 또는 Google 로그인을 사용 설정해 주세요.',
  ],
  'auth/configuration-not-found': [
    'Firebase Authentication이 활성화되어 있지 않습니다.',
    'Firebase 콘솔 → Authentication → 시작하기를 눌러 활성화해 주세요.',
  ],
  'auth/invalid-api-key': ['Firebase API 키가 유효하지 않습니다.', ENV_HINT],
  'auth/api-key-not-valid': ['Firebase API 키가 유효하지 않습니다.', ENV_HINT],
  'auth/app-deleted': ['Firebase 앱이 삭제되었거나 비활성 상태입니다.', ENV_HINT],
  'auth/project-not-found': ['Firebase 프로젝트를 찾을 수 없습니다.', ENV_HINT],

  // ───────── Firestore ─────────
  'permission-denied': ['Firestore 보안 규칙에 막혔습니다.', RULES_HINT],
  unauthenticated: ['로그인 정보가 만료되었습니다.', '로그아웃 후 다시 로그인해 주세요.'],
  unavailable: [
    'Firestore에 연결하지 못했습니다.',
    '네트워크 상태 또는 광고 차단 확장 프로그램을 확인해 주세요.',
  ],
  'not-found': [
    'Firestore 데이터베이스를 찾을 수 없습니다.',
    'Firebase 콘솔 → Firestore Database 에서 데이터베이스를 먼저 생성해 주세요.',
  ],
  'failed-precondition': [
    '이 조회에 필요한 색인이 없습니다.',
    '브라우저 개발자 도구 콘솔에 뜬 색인 생성 링크를 눌러 주세요.',
  ],
  'resource-exhausted': [
    'Firebase 사용 할당량을 초과했습니다.',
    'Firebase 콘솔에서 사용량/요금제를 확인해 주세요.',
  ],
};

/** 에러 코드 추출 (Auth: 'auth/xxx', Firestore: 'permission-denied' 등) */
export function getErrorCode(err) {
  const raw = err?.code;
  return typeof raw === 'string' ? raw : '';
}

/** 보안 규칙 때문에 막힌 상황인지 (만료된 테스트 모드 규칙 포함) */
export function isPermissionError(err) {
  if (getErrorCode(err) === 'permission-denied') return true;
  // SDK가 코드를 안 실어 주는 경우 대비 — 메시지로도 한 번 더 확인
  return /insufficient permissions|permission[- ]denied/i.test(err?.message ?? '');
}

/**
 * Firebase 에러 → { code, message, hint }
 * message는 화면에 굵게, hint는 그 아래 작은 글씨로 띄우면 됩니다.
 */
export function describeFirebaseError(err, fallback = '오류가 발생했습니다.') {
  const code = getErrorCode(err);

  const known = MESSAGES[code];
  if (known) return { code, message: known[0], hint: known[1] };

  if (isPermissionError(err)) {
    const [message, hint] = MESSAGES['permission-denied'];
    return { code: 'permission-denied', message, hint };
  }

  return { code, message: err?.message ?? fallback, hint: '' };
}
