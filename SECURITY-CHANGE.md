# 뚝딱알림장 내부 권한 보완

기준 main: 646e750f64b1a5e986494e265cb67fb4fa17f279.
기존 화면·버튼·교사 로그인·초대 URL /p/:classId/:token·첫 별명확인·동일링크 재접속 순서를 유지한다. 새 학부모 계정/로그인 화면이나 추가 클릭, 기존 데이터의 일괄변경은 없다.

## 원인과 수정

이전 Firestore 규칙은 학급 ID만 알면 부모문서 get/list·알림장 읽기를 허용했고 학부모 수정은 필드명만 제한했다.
보완 규칙은 Firebase 인증된 학급 소유 교사만 SDK로 읽기/쓰기하도록 제한한다. 교사 UID 소유권의 임의 이전도 차단한다.

학부모는 POST /api/parent로 기존 classId + inviteToken을 전달한다. 서버는 매 요청, 같은 Firestore 트랜잭션 안에서 토큰에 맞는 학생을 다시 찾고 해당 학생·학급의 표시정보와 공지만 읽거나 최초확인/재접속시각을 갱신한다. parentId 등 추가 필드는 거부한다. 잘못된 토큰·다른 학급·없는 학급은 같은 일반 오류다. 동일학급 중복토큰도 거부한다.

응답에는 해당 학생 표시이름·별명·확인상태, 학급 표시정보와 공지만 담는다. 토큰·교사 UID·다른 부모문서 목록은 반환하지 않는다. POST JSON·입력 크기/형식/허용필드·Origin 검증, no-store 캐시와 no-referrer를 적용한다. API는 본문·토큰·학생자료·내부 인증오류를 로그로 출력하지 않는다. 재발급/학생삭제 후 다음 요청부터 옛 링크는 차단된다. 이미 확인된 별명·최초접속시각은 재확인 요청으로 덮어쓰지 않는다.

## 장기키 없는 운영 인증

필요한 서버 환경변수 이름:
GCP_PROJECT_ID
GCP_PROJECT_NUMBER
GCP_SERVICE_ACCOUNT_EMAIL
GCP_WORKLOAD_IDENTITY_POOL_ID
GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID

@vercel/oidc getVercelOidcToken → google-auth-library ExternalAccountClient → GoogleAuth → @google-cloud/firestore 직접 SDK를 사용한다. 토큰 갱신과 만료는 공식 인증 라이브러리가 관리한다. 기본 팀 audience 예제이므로 Provider allowed audience를 Vercel 팀 audience와 맞춘다. 현재 google-auth-library는 Node >=22를 요구한다.

firebase-admin Firestore가 임의 credential.getAccessToken 객체를 거부함을 실제 재현하여 그 래퍼 경로는 사용하지 않았다. 로컬/대체용으로만 FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY를 지원한다. 이 작업에서 운영 키를 생성하거나 조회하지 않았다.

공식 참고:
https://vercel.com/docs/oidc/gcp#examples
https://googleapis.dev/nodejs/google-auth-library/latest/interfaces/GoogleAuthOptions.html
https://github.com/googleapis/nodejs-firestore/blob/main/types/firestore.d.ts

## 검증

변경 전 실제 규칙 회귀 7개 중 6개가 “차단되어야 하는 요청이 성공”으로 실패했고 정상 교사관리 1개는 통과했다. API 계약 11개는 경로 부재 HTTP404로 실패했다. WIF 설정만으로 초기화하는 테스트 역시 장기키 요구로 실패한 것을 확인하고 공식 지원 경로로 보완했다.

최종검증:
- npm test: 기존 제출보호 4 + WIF 4.
- npm run test:security: 실제 Firestore 규칙 7 + 실제 API/가상 DB 계약 16.
- node security/ui-smoke.mjs: 실제 Chromium 최초확인/동일버튼/재접속/잘못된토큰/다른학급/다른부모/콘솔/외부접속 8항목.
- npm run build 및 git diff --check.
로그: .cache/verification. 화면: .cache/screenshots.

추가 회귀는 동일학급 중복토큰 401, 재시도 콜백마다 토큰을 재검증해 재발급/삭제 후 401, 합성비밀 DB오류 503 일반응답·로그미노출, Vercel parsed-body 계약을 포함한다. 재시도 테스트는 SDK 경계에서 실제 트랜잭션 콜백을 두 번 실행하고 사이에 가상 DB를 변경하는 방식이며, 실제 운영의 경쟁상황 부하실험은 아니다.

보안검증은 FIRESTORE_EMULATOR_HOST=127.0.0.1:8787과 demo-dd-notice-security 가상 프로젝트만 사용한다.
기존 Java21/Firestore Emulator JAR1.22.0/Playwright/Chromium을 재사용했고 새 런타임을 다운로드하지 않았다.
에뮬레이터: java -jar <기존JAR> --host 127.0.0.1 --port 8787 --project_id demo-dd-notice-security --single_project_mode true --single_project_mode_error true --rules firestore.rules
브라우저검증은 PLAYWRIGHT_MODULE에 기존 모듈 경로, CHROMIUM_EXECUTABLE에 기존 브라우저 경로를 전달한다.
운영 DB·학생자료는 조회하지 않는다.

## 배포 전 루트 검토

작업본은 커밋까지만 준비하며 푸시/배포하지 않는다. WIF/IAM·API 함수 경로를 준비하고 API+UI가 동작하는지 확인한 뒤 검토된 Firestore 규칙을 연계 적용해야 한다. 규칙만 먼저 적용하면 구버전 부모 SDK가 차단된다. API 인증이 실패한 상태에서 규칙을 공개로 완화해 우회하지 않는다.

실제 STS/IAM 토큰교환·IAM권한·Vercel 라우팅·운영규칙 적용은 루트의 후속검증 대상이다. 기존 JS 대형번들/Browserslist 경고는 별도로 남는다.

## 원고·등록서류 반영

“학생별 초대링크를 열고 기존 별명 확인 버튼을 누른 뒤 알림장을 확인한다. 다음부터 같은 링크로 바로 열람한다.”는 사용 설명은 동일하다.

실제 배포 확인 후에만 다음 사실을 반영할 수 있다:
“학급 소유 교사만 데이터베이스에 직접 접근하며, 학부모 요청은 서버가 매번 초대토큰과 학급을 검증하여 해당 학생과 학급 알림장에 한정해 처리한다.”

초대링크는 소지자에게 접근을 허용하는 비밀 링크다. 본 보완은 법정대리인 신원확인·개인정보 동의·처리방침·보유/파기·전체 권리행사 절차를 구현했다는 뜻이 아니다. 공유된 링크, 기존 호스팅의 초대URL 접속기록, 이미 노출된 옛 자료에 대한 운영 보호/대응은 별도다.
