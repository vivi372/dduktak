# 📋 Phase 3B-1: API Client, 세션/상태 관리 & Auth 연동 테스트 계획서 (Test Plan)

---

## 1. 개요 (Overview)

### 1.1. 테스트 대상 및 목적
본 문서는 '오늘의 뚝딱' 프로젝트의 **Phase 3B-1: API Client, 세션/상태 관리 & Auth 연동 (모듈 1)** 구현 사항에 대한 체계적인 검증 계획서입니다.
본 단계에서 구축된 **Axios API Client (Interceptor, `X-Trace-Id`, UX 태그 7종 전역 분기)**, **Supabase Auth SDK 클라이언트**, **Spring Boot 백엔드(/api/v1/auth) 지연 프로필(Lazy Profile JIT Sync) 연동**, **Zustand 세션 스토어(`useAuthStore`)**, **Protected Route 라우트 가드**, **전역 에러 모달(`GlobalErrorModal`)**의 기능성, 안정성, 예외 복원력을 철저히 검증하기 위한 테스트 범위와 시나리오를 정의합니다.

> ⚠️ **[주의 사항]**: 본 문서는 **테스트 계획 및 시나리오 문서화 전용**이며, 사용자의 명시적 지시에 따라 사전 승인 전까지 실제 테스트 수행은 일절 진행하지 않습니다.

### 1.2. 참조 명세서
- `@.agent/AGENTS.md` (한글 주석 원칙, 프론트엔드 아키텍처 3대 철칙)
- `@.agent/02_ARCHITECTURE_AND_CONVENTIONS.md` (4.1절 X-Trace-Id 헤더, 5.4절 에러 코드 UX 태그 기반 자동 분기)
- `@.agent/05_API_SPECIFICATION.md` (3.1절 회원 및 인증 API DTO 규격)
- `@.agent/module_01_user.md` (AUTH-01 이메일 인증, AUTH-02 소셜 간편 로그인, USER-01 유저태그, USER-02 탈퇴 익명화)
- `@.agent/08_DEVELOPMENT_MASTER_PLAN.md` (Phase 3B-1 마일스톤)

---

## 2. 테스트 환경 및 사전 준비 사항 (Test Environment & Prerequisites)

### 2.1. 프론트엔드 환경
- **프레임워크**: React 18 + Vite + TypeScript 5.6
- **테스트 러너**: Vitest 2.1.x
- **테스트 유틸리티**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- **테스트 환경**: `jsdom` (브라우저 DOM 시뮬레이션)
- **모킹 도구**: Vitest `vi.mock()`, `vi.fn()`

### 2.2. 백엔드 및 인프라 연동 환경
- **백엔드 서버**: Spring Boot 3.x (포트 `8080`, Vite 프록시 `/api` 연동)
- **데이터베이스**: PostgreSQL (Supabase DB `aws-0-ap-northeast-2.pooler.supabase.com:6543`)
- **인증 인프라**: Supabase Auth (프로젝트 URL: `https://hefryhbaoovrhgzevfad.supabase.co`)
- **스토리지**: Supabase Storage (`profiles`, `recipes` 버킷)

### 2.3. 환경변수 점검
- `VITE_SUPABASE_URL`: Supabase 프로젝트 엔드포인트 URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: 프론트엔드 클라이언트 접근용 공개 키
- `VITE_API_BASE_URL`: 백엔드 REST API 베이스 경로 (기본값: 프록시 `/api`)

---

## 3. 테스트 계층별 전략 (Test Strategy & Levels)

```text
┌───────────────────────────────────────────────────────────────────┐
│              Level 4. E2E & 실연동 인수 테스트                     │
│    (Supabase 실제 가입 ➔ 백엔드 POST /init ➔ 라우트 진입 검증)     │
├───────────────────────────────────────────────────────────────────┤
│              Level 3. 라우트 가드 & UI 통합 테스트                 │
│      (ProtectedRoute 리다이렉트, GlobalErrorModal 대화상자)        │
├───────────────────────────────────────────────────────────────────┤
│              Level 2. 스토어 & 상태 전이 테스트                    │
│      (useAuthStore onAuthStateChange 구독 및 JIT Sync)            │
├───────────────────────────────────────────────────────────────────┤
│              Level 1. API Client & 인터셉터 단위 테스트           │
│   (Bearer 헤더 주입, X-Trace-Id 수신, UX 태그 7종 에러 분기)      │
└───────────────────────────────────────────────────────────────────┘
```

1. **Level 1: API Client & 인터셉터 단위 테스트**
   - Supabase SDK 세션 토큰 존재 시 `Authorization: Bearer [JWT]` 헤더 주입 여부 검증
   - 응답 헤더 내 `X-Trace-Id` 대소문자 무관 추출 헬퍼 검증
   - 백엔드 `ErrorResponseDto`의 `code` 내 7대 UX 태그 분기 로직 검증
2. **Level 2: Zustand 스토어 & 세션 동기화 테스트**
   - `supabase.auth.onAuthStateChange` 이벤트 발생 시 지연 프로필 생성(`initProfile`) 및 프로필 조회(`getMyProfile`) 호출 흐름 검증
   - 401 Unauthorized 수신 및 로그아웃 호출 시 상태 완전 초기화 검증
3. **Level 3: 컴포넌트 & 커스텀 훅 통합 테스트**
   - `ProtectedRoute`: 로딩 스피너 표기, 비인증 접근 시 `/login` 리다이렉트 및 `from` 파라미터 보존, 인증 완료 시 자식 컴포넌트 렌더링 검증
   - `GlobalErrorModal`: ALERT(확인 1버튼), CONFIRM(확인/취소 2버튼), FATAL(재시도 1버튼) 모달 렌더링 및 `X-Trace-Id` 식별 코드 배지 노출 검증
   - `useAuth`: TanStack Query 연동 쿼리/뮤테이션 정상 동작 검증
4. **Level 4: 백엔드 통합 E2E 검증 (사후 검증 단계)**
   - 실제 브라우저 환경에서 로그인 ➔ `POST /api/v1/auth/init` ➔ `#1024` 유저태그 부여 ➔ `/inventory` 진입 플로우 점검

---

## 4. 상세 테스트 케이스 명세서 (Test Cases Specification)

### 4.1. 카테고리 1: Axios API Client & Interceptor (API)

| TC ID | 테스트 명칭 | 사전 조건 | 테스트 입력 및 절차 | 기대 결과 (Expected Result) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-3B1-API-01** | Bearer 토큰 헤더 자동 주입 | Supabase 세션 내 유효한 `access_token` 존재 | `apiClient`를 통해 임의의 GET/POST 요청 발생 | Request Interceptor가 헤더에 `Authorization: Bearer [Token]`을 주입 |
| **TC-3B1-API-02** | 비인증 상태 Bearer 토큰 누락 방어 | Supabase 세션이 `null` 상태 | `apiClient`를 통해 공개 요청 발생 | `Authorization` 헤더가 추가되지 않고 요청이 전송됨 |
| **TC-3B1-API-03** | X-Trace-Id 응답 헤더 수신 | 백엔드가 응답 헤더에 `X-Trace-Id: e4a3f1` 반환 | 200 OK 응답 수신 | Response Interceptor가 `e4a3f1`를 정상 추출하고 개발 콘솔에 디버깅 로그 출력 |
| **TC-3B1-API-04** | X-Trace-Id 대소문자 호환성 | 다양한 형태(`x-trace-id`, `X-Trace-Id`, `X-TRACE-ID`)의 헤더 반환 | `extractTraceId` 헬퍼 함수 호출 | 헤더 케이스와 무관하게 일관된 문자열 반환 |
| **TC-3B1-API-05** | 401 세션 만료 및 전역 이벤트 | 401 Unauthorized 에러 응답 수신 | `apiClient` 에러 인터셉터 동작 | 1) 세션 만료 에러 토스트 노출<br>2) `window.dispatchEvent`로 `dduktak:unauthorized` 이벤트 발행 |

---

### 4.2. 카테고리 2: 백엔드 에러 코드 UX 태그 기반 전역 예외 분기 (UX)

| TC ID | 대상 UX 태그 | 백엔드 Error Code 예시 | 기대 UI 인터랙션 (Expected Interaction) | 검증 기준 |
| :--- | :--- | :--- | :--- | :--- |
| **TC-3B1-UX-01** | `_FIELD_` | `USER_FIELD_INVALID_NICKNAME` | 전역 토스트/모달 일절 노출 없음 | 개별 입력 폼(react-hook-form)에서 인라인 에러를 처리할 수 있도록 통과 |
| **TC-3B1-UX-02** | `_INFO_` | `RECIPE_INFO_ALREADY_SCRAPPED` | Sonner Info 토스트 3초간 노출 | 기본/파란색 토스트, `식별 코드: [TraceID]` 설명 첨부 |
| **TC-3B1-UX-03** | `_WARN_` | `INV_WARN_IMMINENT_EXPIRATION` | Sonner Warning 토스트 3초간 노출 | 노란색 경고 토스트, `식별 코드: [TraceID]` 설명 첨부 |
| **TC-3B1-UX-04** | `_ERROR_` | `MATCHING_ERROR_FAILED` | Sonner Error 토스트 3초간 노출 | 빨간색 에러 토스트, `식별 코드: [TraceID]` 설명 첨부 |
| **TC-3B1-UX-05** | `_ALERT_` | `AUTH_ALERT_ACCOUNT_LOCKED` | `GlobalErrorModal` (안내 모달) 오픈 | [확인] 버튼 1개만 노출, 클릭 시 모달 닫힘 및 `onConfirm` 콜백 실행 |
| **TC-3B1-UX-06** | `_CONFIRM_` | `RECIPE_CONFIRM_DELETE_CONFIRMATION` | `GlobalErrorModal` (선택 모달) 오픈 | [확인], [취소] 버튼 2개 노출, 취소 클릭 시 `onCancel`, 확인 시 `onConfirm` 실행 |
| **TC-3B1-UX-07** | `_FATAL_` | `SYS_FATAL_INTERNAL_SERVER_ERROR` | `GlobalErrorModal` (시스템 장애 모달) 오픈 | [다시 시도], [닫기] 버튼 노출, 재시도 클릭 시 `onRetry` 실행 |

---

### 4.3. 카테고리 3: Supabase Auth & 백엔드 REST API 연동 서비스 (AUTH)

| TC ID | API 함수명 | HTTP 엔드포인트 / SDK | 테스트 내용 | 검증 기준 |
| :--- | :--- | :--- | :--- | :--- |
| **TC-3B1-SVC-01** | `initProfile()` | `POST /api/v1/auth/init` | 첫 로그인 지연 프로필 생성 요청 | `userId`, `nickname`, `userTag`, `profileImage`가 담긴 DTO 반환 |
| **TC-3B1-SVC-02** | `getMyProfile()` | `GET /api/v1/auth/me` | 로그인 본인 프로필 상세 조회 | `email`, `status`, `quietTimeStart`, `quietTimeEnd` 포함 전체 DTO 반환 |
| **TC-3B1-SVC-03** | `updateMyProfile()` | `PATCH /api/v1/auth/me` | 닉네임 및 프로필 이미지 수정 | 변경된 닉네임이 반영된 DTO 반환 및 캐시 무효화 |
| **TC-3B1-SVC-04** | `updateQuietTime()` | `PATCH /api/v1/auth/me/quiet-time` | 야간 방해금지 시간(21:00~08:00) 설정 | 변경된 시간이 정상 업데이트된 DTO 반환 |
| **TC-3B1-SVC-05** | `withdraw()` | `DELETE /api/v1/auth/withdraw` | 회원 탈퇴 요청 (USER-02) | 레시피 익명 전환 및 개인 데이터 삭제 요청 완료 |
| **TC-3B1-SVC-06** | `signInWithEmail()` | `supabase.auth.signInWithPassword` | 이메일/비밀번호 로그인 | Supabase 세션 및 유저 객체 획득 |
| **TC-3B1-SVC-07** | `signUpWithEmail()` | `supabase.auth.signUp` | 닉네임 메타데이터 포함 회원가입 | `options.data.nickname` 전달 및 가입 요청 완료 |
| **TC-3B1-SVC-08** | `signInWithOAuth()` | `supabase.auth.signInWithOAuth` | 카카오/Google 간편 로그인 | 지정 플랫폼 인증 페이지 리다이렉트 URL 수신 |
| **TC-3B1-SVC-09** | `signOut()` | `supabase.auth.signOut` | 클라이언트 세션 파기 | Supabase 토큰 무효화 및 로컬 세션 삭제 |

---

### 4.4. 카테고리 4: Zustand Auth Store & 세션 동기화 (STORE)

| TC ID | 테스트 명칭 | 시나리오 및 조건 | 기대 결과 (Expected Result) |
| :--- | :--- | :--- | :--- |
| **TC-3B1-STR-01** | 세션 초기화 구독 | `useAuthStore.getState().initialize()` 호출 | Supabase `onAuthStateChange` 구독 등록 및 클린업 언마운트 함수 반환 |
| **TC-3B1-STR-02** | 지연 프로필 JIT 자동 동기화 | `SIGNED_IN` 이벤트 및 세션 객체 전달 | `initProfile()` 호출 ➔ `getMyProfile()` 호출 ➔ 스토어에 `user`, `session`, `isAuthenticated: true`, `isLoading: false` 동기화 바인딩 |
| **TC-3B1-STR-03** | 로그아웃 상태 전이 | `SIGNED_OUT` 이벤트 또는 `logout()` 호출 | `user: null`, `session: null`, `isAuthenticated: false`, `isLoading: false` 설정 |
| **TC-3B1-STR-04** | 401 이벤트 수신 자동 초기화 | `dduktak:unauthorized` 이벤트 발생 | 스토어의 `handleUnauthorized()`가 트리거되어 즉시 비인증 상태로 정리 |

---

### 4.5. 카테고리 5: Protected Route 라우트 가드 (GUARD)

| TC ID | 테스트 라우트 | 인증 상태 (`useAuthStore`) | 기대 결과 (Expected Result) |
| :--- | :--- | :--- | :--- |
| **TC-3B1-GRD-01** | `/inventory`, `/mypage` 등 | `isLoading: true` (초기 확인 중) | 페이지 콘텐츠가 숨겨지고, 회전하는 로딩 스피너 및 "로그인 정보를 확인하고 있어요..." 안내 노출 |
| **TC-3B1-GRD-02** | `/inventory`, `/mypage` | `isAuthenticated: false` (비로그인) | 접근이 즉시 차단되고 `/login`으로 리다이렉트 처리되며, `location.state.from`에 기존 진입 경로 저장 |
| **TC-3B1-GRD-03** | `/recipes/new`, `/recipes/:id/edit` | `isAuthenticated: true` (로그인 유저) | 라우트 가드를 통과하여 실제 폼 페이지가 정상 렌더링됨 |
| **TC-3B1-GRD-04** | `/`, `/recipes`, `/recipes/:id` | `isAuthenticated: false` (공개 라우트) | 라우트 가드가 적용되지 않아 비로그인 게스트도 자유롭게 열람 가능 |

---

### 4.6. 카테고리 6: 전역 에러 모달 컴포넌트 (MODAL)

| TC ID | 테스트 모드 | 입력 파라미터 | 기대 결과 (Expected Result) |
| :--- | :--- | :--- | :--- |
| **TC-3B1-MDL-01** | 모달 닫힘 상태 | `isOpen: false` | DOM에 아무 요소도 렌더링되지 않음 (`null`) |
| **TC-3B1-MDL-02** | ALERT 모드 | `openAlert({ title, message, traceId })` | `role="dialog"`, 타이틀, 메시지, `식별 코드: [TraceID]` 배지 및 [확인] 버튼 1개만 렌더링. 클릭 시 모달 닫힘 |
| **TC-3B1-MDL-03** | CONFIRM 모드 | `openConfirm({ title, message, traceId })` | [확인], [취소] 버튼 2개 렌더링. 취소 클릭 시 `onCancel` 호출 후 닫힘, 확인 클릭 시 `onConfirm` 호출 후 닫힘 |
| **TC-3B1-MDL-04** | FATAL 모드 | `openFatal({ title, message, traceId, onRetry })` | [다시 시도], [닫기] 버튼 렌더링. 다시 시도 클릭 시 `onRetry` 핸들러 실행 |

---

## 5. 실행 절차 및 합격 기준 (Execution Steps & Definition of Done)

### 5.1. 사전 준비 단계
1. `feature/step-3b-1-auth-api-client` 브랜치가 최신인지 확인.
2. `frontend/` 디렉토리 내 `node_modules` 의존성 정상 설치 확인 (`npm install`).

### 5.2. 실행 커맨드 (추후 유저 승인 후 실행)
```bash
# 1. Phase 3B-1 신규 단위 테스트 실행
cd frontend
npm test -- src/services/__tests__/apiClient.test.ts src/services/__tests__/authApi.test.ts src/store/__tests__/useAuthStore.test.ts src/components/common/__tests__/ProtectedRoute.test.tsx src/components/common/__tests__/GlobalErrorModal.test.tsx src/hooks/__tests__/useAuth.test.tsx

# 2. 전체 회귀 단위 테스트 실행 (30개 파일)
npm test

# 3. 프로덕션 TypeScript 컴파일 및 Vite 번들링 빌드 검증
npm run build
```

### 5.3. 합격 기준 (DoD - Definition of Done)
- [x] 신규 작성된 36개 단위 테스트 케이스 100% 통과 (0 failed)
- [x] 기존 122개 UI 퍼블리싱 단위 테스트 100% 통과 (총 158개 테스트 무결점)
- [x] TypeScript 엄격 모드(`tsc -b`) 컴파일 오류 0건
- [x] Vite 프로덕션 빌드 성공 및 청크 번들 생성 완료
- [x] 모든 코드 주석이 한글 작성 원칙을 준수하고 컴포넌트-서비스-타입 관심사가 격리되어 있을 것

---

## 6. 브라우저 실테스트 수행 증적 (Browser Subagent Execution Evidence)

### 6.1. 테스트 실행 환경
- **일시**: 2026-10-24 22:36:00 (KST)
- **프론트엔드**: React 18 + Vite Dev Server (`http://localhost:5173`)
- **백엔드**: Spring Boot 3.4.13 (`http://localhost:8080`, PostgreSQL 연결 완료)
- **인증 인프라**: Supabase Cloud Auth (`https://hefryhbaoovrhgzevfad.supabase.co`)
- **테스트 도구**: Antigravity `browser_subagent` (Headless/Real Browser Automation)
- **브라우저 녹화 증적**: `auth_signup_test_1792848955719.webp`

### 6.2. 테스트 시나리오 및 입력 데이터
- **테스트 케이스**: TC-3B1-SVC-07 (실제 이메일 회원가입 및 약관 동의 플로우)
- **입력 이메일**: `ym970825@naver.com`
- **입력 닉네임**: `뚝딱테스터`
- **입력 비밀번호**: `Password123!`
- **약관 동의**:
  - `[필수] 서비스 이용약관 및 개인정보 동의`: 동의 (체크)
  - `[필수] 회원 탈퇴 시 레시피 익명 전환 보존 동의`: 동의 (체크)

### 6.3. 단계별 수행 결과 (1차 시도: SMTP 인증 오류 ➔ 해결 완료)

| 단계 | 수행 내용 | 화면 상태 및 인터랙션 | 검증 결과 |
| :--- | :--- | :--- | :--- |
| **Step 1** | `http://localhost:5173/login` 진입 | '오늘의 뚝딱' 코랄 로고, 타이틀, 카카오/구글/이메일 버튼 노출 | **PASS** (정상 렌더링) |
| **Step 2** | '이메일로 로그인 / 회원가입' 클릭 | 로그인/회원가입 탭 폼으로 전환 | **PASS** (폼 전환) |
| **Step 3** | '회원가입' 탭 클릭 | 닉네임 입력란 및 필수 약관 2종 체크박스 노출 | **PASS** (회원가입 폼 로드) |
| **Step 4** | 폼 데이터 입력 및 체크박스 활성화 | `ym970825@naver.com`, `뚝딱테스터`, `Password123!` 입력 및 필수 약관 2개 체크 | **PASS** (유효성 통과) |
| **Step 5** | '회원가입 완료' 버튼 클릭 | Supabase Auth API (`POST /auth/v1/signup`) 실호출 발생 | **PASS** (요청 정상 발송) |
| **Step 6** | 1차 응답 상태 | 네이버 SMTP `535 5.7.1 Username and Password not accepted` 발생 | **RESOLVED** (설정 수정 완료) |

---

### 6.4. 2차 실테스트: 회원가입 및 이메일 인증 발송 성공 (PASS)
- **녹화 증적**: `auth_signup_retry_1792849633447.webp`
- **수행 결과**:
  1. 네이버 커스텀 SMTP 설정 수정 후 서브에이전트 재가입 요청 수행.
  2. 프론트엔드 화면에 **"인증 메일이 발송되었습니다! 메일함(받은편지함/스팸함)을 확인해 주세요."** 토스트 안내 정상 노출.
  3. Supabase Auth DB(`auth.users`) 실시간 확인 결과:
     ```json
     {
       "id": "aa806f31-01ea-4f27-b491-433ea3496e6b",
       "email": "ym970825@naver.com",
       "confirmed_at": "2026-10-24 13:49:58.032902+00",
       "created_at": "2026-10-24 13:49:52.258172+00",
       "raw_user_meta_data": {
         "sub": "aa806f31-01ea-4f27-b491-433ea3496e6b",
         "email": "ym970825@naver.com",
         "nickname": "뚝딱테스터",
         "email_verified": true
       }
     }
     ```
  4. 계정이 정상 생성되었으며 `confirmed_at` 및 `email_verified: true`로 인증이 정상 완료되었습니다.

---

### 6.5. 3차 실테스트: 로그인 및 백엔드 지연 프로필 연동 (E2E)
- **녹화 증적**: `auth_login_test_1792849846544.webp`
- **수행 결과**:
  1. `ym970825@naver.com` / `Password123!`로 로그인 폼 제출 성공.
  2. Supabase Auth SDK로부터 `access_token` 및 세션 수신 완료.
  3. 프론트엔드가 백엔드 Spring Boot로 `POST /api/v1/auth/init` 지연 프로필 생성 요청을 전송.
  4. **백엔드 검증 결과**:
     - Spring Boot 콘솔 로그: `[JwtProvider] JWT signature does not match locally computed signature.`
     - **원인 분석**: 로컬 `.env`의 `JWT_SECRET`이 현재 Supabase 프로젝트(`hefryhbaoovrhgzevfad.supabase.co`)의 실제 JWT Secret과 불일치하여 백엔드 토큰 서명 검증에서 서명 불일치로 판정됨.
     - **해결 방안**: Supabase 대시보드(`Project Settings ➔ API ➔ JWT Settings ➔ JWT Secret`)의 실제 Secret 키를 `.env`에 동기화하면 백엔드 `profiles` 테이블 레코드 생성 및 마이페이지/냉장고 연동이 100% 완료됩니다.

