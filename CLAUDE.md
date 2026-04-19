# 뚝딱알림장 — CLAUDE.md

> 뚝딱 시리즈 · L3 React + Firebase · 학급 단위 초경량 알림장 앱

---

## 📌 프로젝트 정체성

**핵심 컨셉**: "우리 반 전용, 담임이 딸깍 한 번에 올리는 알림장"

**하이클래스/학교종이와의 결정적 차이**
- ❌ 학교 통합 시스템 X
- ❌ 학부모 앱 설치 X
- ❌ 복잡한 행정 연동 X
- ✅ **담임 1명 + 학부모 N명**, 그 이상도 이하도 아님
- ✅ **일회성 링크 초대**로 학부모 식별 (앱 설치 0, 로그인 0)
- ✅ 바이브코딩으로 교사가 자기 반 스타일 커스텀 가능

**포지셔닝**: 앤써북 책 "코딩 모르는 선생님을 위한 바이브코딩 레시피 100"의 **6번째 메인 앱**

---

## 🎨 디자인 토큰 (뚝딱 시리즈 · 독자 톤)

**무드**: 종이 쪽지 감성, 크래프트 감성, 손글씨 느낌

### 컬러 팔레트
```css
/* 베이스 (크라프트 종이) */
--paper-bg: #FAF6EE;        /* 크라프트 배경 */
--paper-card: #FFFCF5;      /* 쪽지 카드 배경 */
--paper-line: #E8DFD0;      /* 종이 경계선 */

/* 잉크 */
--ink-primary: #3D2E1F;     /* 진한 갈색 (본문) */
--ink-secondary: #6B5B47;   /* 연한 갈색 (서브텍스트) */
--ink-accent: #D4574E;      /* 빨간펜 (강조/중요) */

/* 마스킹테이프/스티커 포인트 */
--tape-yellow: #F5D76E;
--tape-mint: #A8D8C8;
--tape-coral: #F5A89B;
```

### 타이포그라피
- **본문**: Pretendard (가독성 우선)
- **손글씨 포인트** (제목/시그니처): `Gaegu` 또는 `Nanum Pen Script` (Google Fonts)
- **크기**: 본문 16px / 제목 20~24px

### 질감 표현
- `border-radius: 4px~8px` (각지게, 종이 느낌)
- 카드에 약간의 그림자: `box-shadow: 2px 3px 0 rgba(0,0,0,0.08)`
- 마스킹테이프 모티브로 카드 상단 장식 가능
- ❌ 너무 둥근 radius (뚝딱 기존 앱과 차별)

---

## 🏗️ 스택

- **프론트**: React + Vite + Tailwind CSS
- **백엔드**: Firebase Auth + Firestore
- **배포**: Vercel
- **폰트**: Pretendard + Gaegu (Google Fonts CDN)

---

## 📂 Firestore 구조

```
/classes/{classId}
  ├─ name: string              (예: "3학년 2반")
  ├─ teacherName: string       (예: "용쌤")
  ├─ teacherUid: string
  ├─ inviteCodePrefix: string  (학급 식별용, 예: "yongclass")
  └─ createdAt: timestamp

/classes/{classId}/notices/{noticeId}
  ├─ date: string              (YYYY-MM-DD)
  ├─ content: string           (알림장 본문)
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp

/classes/{classId}/parents/{parentId}
  ├─ studentName: string       (학생 이름, 교사가 입력)
  ├─ inviteToken: string       (일회성 초대 토큰, UUID)
  ├─ tokenUsed: boolean        (링크 첫 클릭 시 true)
  ├─ parentNickname: string    (학부모가 첫 진입 시 입력, 예: "OO엄마")
  ├─ invitedAt: timestamp
  ├─ firstAccessAt: timestamp | null
  └─ lastAccessAt: timestamp | null

/classes/{classId}/access_logs/{logId}  (선택: 누가 언제 봤나)
  ├─ parentId: string
  ├─ noticeId: string
  ├─ accessedAt: timestamp
```

---

## 🔐 일회성 링크 초대 플로우 (핵심 기능)

### 교사 측
1. 학급 생성 → 학생 명단 입력 (예: 25명)
2. 학생별로 초대 링크 자동 생성
   - URL 구조: `https://ddalkak-notice.vercel.app/p/{classId}/{inviteToken}`
3. 링크를 복사해 학부모에게 카톡/문자로 개별 전송
4. 교사 대시보드에서 "누가 링크 클릭했는지" 확인 가능

### 학부모 측
1. 링크 클릭 → 첫 진입 시 "학생 이름 확인 + 본인 별명 입력" 화면
   - 예: "김철수 학부모님이신가요? 뭐라고 부를까요? (예: 철수엄마)"
2. 확인 후 → `tokenUsed = true`, `parentNickname` 저장
3. 이후 같은 링크로 재접속 시 → 바로 알림장 목록으로
4. 앱 설치 / 로그인 / 회원가입 **전부 없음**

### 보안 원칙
- `inviteToken`은 UUID v4 (추측 불가)
- 한 링크 = 한 학생 = 한 학부모 슬롯
- 교사는 언제든 링크 재발급 가능 (기존 토큰 무효화)

---

## 🔒 Firestore 보안 규칙 (초안 방향)

```javascript
// 교사: 자기 학급만 읽기/쓰기
// 학부모: inviteToken이 일치해야 자기 학급 notices만 읽기 가능
// → 실제 규칙은 개발 중 Phase 4에서 확정
```

⚠️ **절대 원칙**: 보안 규칙 없이 프로덕션 배포 금지

---

## 🔧 환경변수 (.env.local)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 🦶 푸터 (필수)

```jsx
<footer className="text-center pb-6 text-xs" style={{color:'#64748b'}}>
  © 2026 <a href="https://mumuclass.kr" style={{color:'#64748b'}}>무궁무진클래스</a> · 용쌤
</footer>
```

---

## 📝 MVP 범위 (샘플원고 병행 원칙)

### ✅ 포함 (MVP v1)
- 교사 로그인 (Firebase Auth, 이메일/구글)
- 학급 1개 생성
- 학생 명단 입력 (이름만)
- 초대 링크 자동 생성 + 복사 버튼
- 알림장 작성 (날짜 + 본문, 단순 텍스트)
- 알림장 목록 (교사 뷰 / 학부모 뷰)
- 학부모 첫 진입 인증 플로우

### 🔒 MVP 제외 (추후)
- ❌ 준비물 관리
- ❌ 숙제 관리
- ❌ 사진 첨부
- ❌ 웹푸시 알림
- ❌ 복수 학급 지원
- ❌ 학부모 댓글/이모지 반응

---

## 📐 코드 컨벤션

- 주석: **한국어**
- Firestore 컬렉션명: 영어 소문자
- 컴포넌트 파일명: PascalCase (예: `NoticeCard.jsx`)
- 훅 파일명: camelCase (예: `useClass.js`)

---

## 🚫 금지사항

- README.md 자동 생성 ❌
- 이 CLAUDE.md 무단 수정 ❌
- 보안 규칙 없이 프로덕션 배포 ❌
- API 키 Git 커밋 ❌
- 기능 스콥 임의 확장 (MVP 범위 외 추가 금지) ❌

---

## 🎯 성공 기준

- 교사가 학급 생성부터 첫 알림장 발송까지 **5분 내** 가능
- 학부모가 링크 클릭 후 **10초 내** 알림장 확인 가능
- 앱 설치 유도 창 / 로그인 요구 / 회원가입 절대 없음
