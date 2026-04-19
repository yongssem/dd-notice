# 뚝딱알림장 — Claude Code 첫 프롬프트

> 이 파일의 "프롬프트" 부분만 복사해서 Claude Code에 붙여넣으세요.

---

## 📋 사전 준비 (용쌤이 직접)

1. **Firebase 프로젝트 생성**
   - 콘솔: https://console.firebase.google.com
   - 프로젝트명: `ddalkak-notice` (권장)
   - 리전: `asia-northeast3` (서울)
   - Firestore 활성화 (프로덕션 모드)
   - Authentication 활성화 (이메일/비밀번호 + Google)

2. **Vercel 프로젝트 준비**
   - GitHub 레포 먼저 만들어두면 연동 쉬움
   - 프로젝트명: `ddalkak-notice`

3. **도메인 구상 (선택)**
   - `ddalkak-notice.vercel.app` (기본)
   - 커스텀 원하면 `notice.ddalkak.kr` 등

---

## 🚀 Claude Code에 붙여넣을 프롬프트

```
이 프로젝트 최상위에 이미 CLAUDE.md가 있어. 먼저 반드시 읽고, 거기 적힌
규칙(디자인 토큰, 푸터, 금지사항, MVP 범위)을 전부 지킬 것.

앱 이름: 뚝딱알림장
브랜드: 뚝딱 시리즈 (독자 톤 - 종이/크래프트 감성)
레벨: L3 (React + Vite + Tailwind + Firebase)

## 프로젝트 맥락
- 용쌤(18년차 초등교사)의 무궁무진클래스 앱
- 앤써북 책 "코딩 모르는 선생님을 위한 바이브코딩 레시피 100"의 6번째 메인 앱
- 포지션: 하이클래스/학교종이와 정반대 - 학급 단위 초경량 알림장
- 핵심 무기: 학부모 앱 설치 불필요 + 일회성 링크 초대로 식별

## 진행 순서

[Phase 1] 프로젝트 초기화
- Vite + React 프로젝트 생성 (ddalkak-notice)
- Tailwind CSS 설정
- 폴더 구조: src/components, src/pages, src/hooks, src/lib, src/styles
- Pretendard + Gaegu 폰트 CDN 연결
- 작업 완료 후 나한테 확인 받기

[Phase 2] 디자인 시스템 (종이/크래프트 톤)
- tailwind.config.js에 CLAUDE.md의 디자인 토큰 반영
  · paper-bg, paper-card, paper-line
  · ink-primary, ink-secondary, ink-accent
  · tape-yellow, tape-mint, tape-coral
- 공통 컴포넌트:
  · Button (종이 버튼 느낌, 약간의 그림자)
  · Card (마스킹테이프 장식 가능한 쪽지 카드)
  · Footer (CLAUDE.md 규격 준수)
- 샘플 페이지로 토큰 시각 확인
- 작업 완료 후 나한테 확인 받기

[Phase 3] Firebase 연동 + Auth
- Firebase SDK 설치 및 초기화 (src/lib/firebase.js)
- .env.local 템플릿 (.env.local.example) 생성
- useAuth 훅 (이메일/Google 로그인)
- 교사 로그인 페이지
- 보호된 라우트 (교사만 접근)
- 작업 완료 후 나한테 확인 받기

[Phase 4] 핵심 기능 - 학급 생성 + 학생 명단 + 초대 링크
- 학급 생성 페이지 (학급명, 교사이름)
- 학생 명단 입력 UI (한 줄에 한 명씩 or 붙여넣기)
- 초대 링크 자동 생성 (UUID v4 기반 inviteToken)
- 링크 목록 UI + 복사 버튼
- Firestore 보안 규칙 1차 작성 (firestore.rules)
- 작업 완료 후 나한테 확인 받기

[Phase 5] 알림장 CRUD + 학부모 뷰
- 교사: 알림장 작성/수정/삭제
- 알림장 목록 (날짜별 최신순)
- 학부모 진입 페이지 (/p/:classId/:inviteToken)
  · 첫 진입: 학생 확인 + 별명 입력
  · 재진입: 바로 알림장 목록
- 학부모 뷰: 읽기 전용, 심플하게
- 작업 완료 후 나한테 확인 받기

[Phase 6] 배포 준비
- Vercel 배포 설정 (vercel.json 필요 시)
- 환경변수 Vercel에 반영
- 로컬 스모크 테스트 시나리오:
  1) 교사 가입 → 학급 생성 → 학생 5명 입력
  2) 초대 링크 복사 → 시크릿 모드로 열기
  3) 학부모 첫 진입 인증
  4) 교사가 알림장 작성 → 학부모 화면에 보이는지
  5) 재접속 시 인증 건너뛰는지
- 작업 완료 후 나한테 확인 받기

## 엄격한 제약
- 각 Phase 끝날 때마다 반드시 확인 받고 다음으로 넘어갈 것
- MVP 범위 외 기능 임의 추가 금지 (준비물/숙제/사진/푸시 전부 제외)
- README.md 만들지 말 것
- CLAUDE.md 수정하지 말 것
- 보안 규칙 없이 배포 금지
- Firebase 설정값은 반드시 .env.local (커밋 금지)

## 진행 스타일
- 용쌤(ENTP)은 병행 작업 많음. 현재 앤써북 샘플원고(4/21) + 전람회 원서(5/14) 동시 진행 중.
- 각 Phase 한 번에 끝내려 하지 말고, 작은 단위로 동작 확인하며 진행.
- 질문 애매하면 추측하지 말고 되물을 것.

시작하자.
```

---

## 💡 용쌤 체크리스트 (이 프롬프트 붙여넣기 전)

- [ ] `/home/claude/CLAUDE.md` 파일을 프로젝트 루트에 복사했는가?
- [ ] Firebase 프로젝트 생성 완료?
- [ ] Firestore / Auth 활성화 완료?
- [ ] 지금 샘플원고 작업 중이 아닌가? (우선순위 체크)

---

## ⏰ 예상 소요 시간

| Phase | 예상 시간 | 비고 |
|---|---|---|
| Phase 1 (초기화) | 20분 | 거의 자동 |
| Phase 2 (디자인) | 40분 | 종이 톤 검증에 시간 듦 |
| Phase 3 (Auth) | 30분 | Firebase 콘솔 왕복 필요 |
| Phase 4 (학급/학생/링크) | 60분 | 핵심 로직 |
| Phase 5 (알림장 + 학부모 뷰) | 60분 | 핵심 로직 |
| Phase 6 (배포) | 30분 | Vercel 연동 |
| **총합** | **약 4시간** | 쉬는시간 쪼개쓰기 권장 |

---

## 🚨 냉철한 참모 당부

용쌤, 이거 만들면서 **샘플원고 작업시간 밀리면 즉시 중단**하기로 약속한 거 기억하시죠? 🧊
샘플원고 제출 후(4/22 이후)에 본격 개발하는 게 제일 안전합니다.
지금은 CLAUDE.md만 박아두고 Phase 1까지만 시동 걸어두는 게 최선일 수 있습니다.
